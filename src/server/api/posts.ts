import { FastifyInstance } from "fastify"
import { postService } from "../services/postService"
import { postValidation } from "../../db/validation"
import { InvalidRequestError, NotFoundError, ServerError, UnauthorizedError } from "../../errors"
import {
  ensureCommunityMemberIfPrivate,
  getActiveMemberOrDie,
  getUserIdOrDie,
  getUserOrDie,
} from "./util"
import { isUuid } from "../../utils"
import { NewPostDTO, NewPostResponse } from "../../types/post"
import { Poll } from "../../db/schema/polls"

export function configurePostsRoutes(app: FastifyInstance) {
  app.post<{ Body: NewPostDTO }>("/api/posts", async (req) => {
    const userId = getUserIdOrDie(req)
    const { title, content, communityId } = req.body
    if (!postValidation.isPostValid({ title, content })) throw new InvalidRequestError()

    await getActiveMemberOrDie(req, communityId)

    const post = await postService.createPost({
      title,
      content,
      communityId,
      ownerId: userId,
    })
    if (!post) throw new ServerError()

    let urls: string[] = []
    if (req.body.numMedia) {
      const uploadUrls = await Promise.all(
        Array.from({ length: req.body.numMedia }).map(async (_, i) => {
          return postService.getPostMediaUploadUrl(post.id, i)
        })
      )
      urls = uploadUrls.filter((url) => !!url && typeof url === "string") as string[]
      if (urls.length !== req.body.numMedia) throw new ServerError()
    }

    let poll: Poll | undefined

    if (req.body.poll) {
      poll = await postService.createPostPoll(post.id, req.body.poll)
      if (!poll) throw new ServerError()
    }

    return {
      post,
      urls,
      poll,
    } as NewPostResponse
  })

  app.patch<{ Params: { postId: string }; Body: { urls: string[] } }>(
    "/api/posts/:postId/media",
    async (req) => {
      const userId = getUserIdOrDie(req)
      const post = await postService.getPost(req.params.postId)
      if (!post) throw new NotFoundError()
      if (post.ownerId !== userId) {
        throw new UnauthorizedError()
      }

      await postService.deletePostMedia(req.params.postId)

      const res = await postService.updatePostMedia(req.params.postId, req.body.urls)
      if (!res) throw new ServerError()
      return {
        urls: res.map(({ url }) => url),
      }
    }
  )

  app.get<{ Params: { postId: string } }>("/api/posts/:postId", async (req) => {
    if (!req.params.postId || !isUuid(req.params.postId)) throw new InvalidRequestError()

    const [postData, comments] = await Promise.all([
      postService.getPostWithMetadata(req.params.postId, req.cookies.user_id),
      postService.getPostComments(req.params.postId, 0),
    ])
    if (!postData || !comments) throw new NotFoundError()

    await ensureCommunityMemberIfPrivate(req, postData.communityId)

    return {
      ...postData,
      comments,
    }
  })

  app.patch<{
    Params: { postId: string }
    Body: { title?: string; content?: string; deleted?: boolean; disabled?: boolean }
  }>("/api/posts/:postId", async (req) => {
    if (!req.params.postId || !isUuid(req.params.postId)) throw new InvalidRequestError()
    const userId = getUserIdOrDie(req)

    const post = await postService.getPost(req.params.postId)
    if (!post) throw new NotFoundError()
    if (post.ownerId !== userId) {
      const member = await getActiveMemberOrDie(req, post.communityId)
      if (["owner", "moderator"].indexOf(member.memberType) === -1) throw new UnauthorizedError()
      delete req.body.title
      delete req.body.content
    }

    const { title, content, deleted, disabled } = req.body

    post.title = title ?? post.title
    post.content = content ?? post.content
    post.deleted = deleted ?? post.deleted
    post.disabled = disabled ?? post.disabled

    if (!postValidation.isPostValid(post)) throw new InvalidRequestError()

    await ensureCommunityMemberIfPrivate(req, post.communityId)

    const res = await postService.updatePost(req.params.postId, post)
    if (!res) throw new ServerError()
    return res
  })

  app.get<{ Params: { postId: string }; Querystring: { offset: string } }>(
    "/api/posts/:postId/comments",
    async (req) => {
      const offset = parseInt(req.query.offset)
      if (!req.params.postId || !isUuid(req.params.postId)) throw new InvalidRequestError()

      if (isNaN(offset)) throw new InvalidRequestError()

      const post = await postService.getPost(req.params.postId)
      if (!post) throw new NotFoundError()

      await ensureCommunityMemberIfPrivate(req, post.communityId)

      const res = await postService.getPostComments(req.params.postId, offset)
      if (!res) throw new ServerError()
      return res
    }
  )

  app.post<{ Params: { postId: string }; Body: { comment: string } }>(
    "/api/posts/:postId/comments",
    async (req) => {
      const user = getUserOrDie(req)

      const post = await postService.getPost(req.params.postId)
      if (!post) throw new NotFoundError()

      await ensureCommunityMemberIfPrivate(req, post.communityId)

      const res = await postService.addPostComment(req.params.postId, user, req.body.comment)
      if (!res) throw new ServerError()
      return res
    }
  )

  app.patch<{
    Params: { postId: string; commentId: string }
    Body: { comment?: string; deleted?: boolean }
  }>("/api/posts/:postId/comments/:commentId", async (req) => {
    const userId = getUserIdOrDie(req)

    const post = await postService.getPost(req.params.postId)
    if (!post) throw new NotFoundError()
    if (post.ownerId !== userId) {
      const member = await getActiveMemberOrDie(req, post.communityId)
      if (["owner", "moderator"].indexOf(member.memberType) === -1) throw new UnauthorizedError()
    }

    const { comment, deleted } = req.body

    const res = await postService.updatePostComment(req.params.commentId, {
      content: comment,
      deleted,
    })
    if (!res) throw new ServerError()
    return res
  })

  app.post<{ Params: { postId: string; commentId: string }; Body: { reaction: boolean } }>(
    "/api/posts/:postId/comments/:commentId/reactions",
    async (req) => {
      const userId = getUserIdOrDie(req)

      if (!req.params.commentId || !isUuid(req.params.commentId)) throw new InvalidRequestError()

      const post = await postService.getPost(req.params.postId)
      if (!post) throw new NotFoundError()

      await ensureCommunityMemberIfPrivate(req, post.communityId)

      const res = await postService.addPostCommentReaction(
        req.params.commentId,
        userId,
        req.body.reaction
      )
      if (!res) throw new ServerError()
      return res
    }
  )

  app.post<{ Params: { postId: string }; Body: { reaction: boolean } }>(
    "/api/posts/:postId/reactions",
    async (req) => {
      const userId = getUserIdOrDie(req)

      const post = await postService.getPost(req.params.postId)
      if (!post) throw new InvalidRequestError()

      await ensureCommunityMemberIfPrivate(req, post.communityId)

      const res = await postService.addPostReaction(req.params.postId, userId, req.body.reaction)
      if (!res) throw new ServerError()
      return res
    }
  )
}
