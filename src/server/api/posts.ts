import { FastifyInstance } from "fastify"
import { postService } from "../services/postService"
import { postValidation } from "../../db/validation"
import { InvalidRequestError, NotFoundError, ServerError, UnauthorizedError } from "../../errors"
import {
  ensureCommunityMemberIfPrivate,
  ensureCommunityModerator,
  getActiveMemberOrDie,
  resolve,
  getUserIdOrDie,
  getUserOrDie,
  uuidOrDie,
} from "./util"
import { NewPostDTO, NewPostResponse } from "../../types/post"
import { Poll } from "../../db/schema/polls"

export function configurePostsRoutes(app: FastifyInstance) {
  app.post<{ Body: NewPostDTO }>("/api/posts", async (req) => {
    const userId = getUserIdOrDie(req)
    const { title, content, communityId } = req.body
    if (!postValidation.isPostValid({ title, content })) throw new InvalidRequestError()

    await getActiveMemberOrDie(req, communityId)

    const post = await resolve(
      postService.createPost({
        title,
        content,
        communityId,
        ownerId: userId,
      })
    )

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
      poll = await resolve(postService.createPostPoll(post.id, req.body.poll))
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
      const postId = uuidOrDie(req.params.postId)

      const post = await resolve(postService.getPost(postId), NotFoundError)
      if (post.ownerId !== userId) throw new UnauthorizedError()

      await postService.deletePostMedia(postId)

      const res = await resolve(postService.updatePostMedia(postId, req.body.urls))
      return {
        urls: res,
      }
    }
  )

  app.get<{ Params: { postId: string } }>("/api/posts/:postId", async (req) => {
    const postId = uuidOrDie(req.params.postId)

    const [postData, comments] = await Promise.all([
      resolve(postService.getPostWithMetadata(postId, req.cookies.user_id), NotFoundError),
      resolve(postService.getPostComments(postId, 0), NotFoundError),
    ])

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
    const postId = uuidOrDie(req.params.postId)
    const userId = getUserIdOrDie(req)

    const post = await resolve(postService.getPost(postId), NotFoundError)

    if (post.ownerId !== userId) {
      const member = await getActiveMemberOrDie(req, post.communityId)
      ensureCommunityModerator(member)
      // if we're not the community owner or a moderator, we can't overwrite the title or content
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

    return resolve(postService.updatePost(postId, post))
  })

  app.get<{ Params: { postId: string }; Querystring: { offset: string } }>(
    "/api/posts/:postId/comments",
    async (req) => {
      const postId = uuidOrDie(req.params.postId)
      const offset = parseInt(req.query.offset)
      if (isNaN(offset)) throw new InvalidRequestError()

      const post = await resolve(postService.getPost(postId), NotFoundError)

      await ensureCommunityMemberIfPrivate(req, post.communityId)

      return resolve(postService.getPostComments(postId, offset))
    }
  )

  app.post<{ Params: { postId: string }; Body: { comment: string } }>(
    "/api/posts/:postId/comments",
    async (req) => {
      const postId = uuidOrDie(req.params.postId)
      const user = getUserOrDie(req)

      const post = await resolve(postService.getPost(postId), NotFoundError)

      await ensureCommunityMemberIfPrivate(req, post.communityId)

      return resolve(postService.addPostComment(postId, user, req.body.comment))
    }
  )

  app.patch<{
    Params: { postId: string; commentId: string }
    Body: { comment?: string; deleted?: boolean }
  }>("/api/posts/:postId/comments/:commentId", async (req) => {
    const postId = uuidOrDie(req.params.postId)
    const commentId = uuidOrDie(req.params.commentId)
    const userId = getUserIdOrDie(req)

    const post = await resolve(postService.getPost(postId), NotFoundError)

    if (post.ownerId !== userId) {
      const member = await getActiveMemberOrDie(req, post.communityId)
      ensureCommunityModerator(member)
    }

    const { comment, deleted } = req.body

    return resolve(
      postService.updatePostComment(commentId, {
        content: comment,
        deleted,
      })
    )
  })

  app.post<{ Params: { postId: string; commentId: string }; Body: { reaction: boolean } }>(
    "/api/posts/:postId/comments/:commentId/reactions",
    async (req) => {
      const postId = uuidOrDie(req.params.postId)
      const commentId = uuidOrDie(req.params.commentId)
      const userId = getUserIdOrDie(req)

      const post = await resolve(postService.getPost(postId), NotFoundError)

      await ensureCommunityMemberIfPrivate(req, post.communityId)

      return resolve(postService.addPostCommentReaction(commentId, userId, req.body.reaction))
    }
  )

  app.post<{ Params: { postId: string }; Body: { reaction: boolean } }>(
    "/api/posts/:postId/reactions",
    async (req) => {
      const postId = uuidOrDie(req.params.postId)
      const userId = getUserIdOrDie(req)

      const post = await resolve(postService.getPost(postId), InvalidRequestError)

      await ensureCommunityMemberIfPrivate(req, post.communityId)

      return resolve(postService.addPostReaction(postId, userId, req.body.reaction))
    }
  )
}
