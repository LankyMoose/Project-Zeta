import { FastifyInstance } from "fastify"
import { postService } from "../services/postService"
import { NewPost } from "../../db/schema"
import { postValidation } from "../../db/validation"
import { InvalidRequestError, NotFoundError, ServerError, UnauthorizedError } from "../../errors"
import {
  ensureCommunityMemberIfPrivate,
  getActiveMemberOrDie,
  getUserIdOrDie,
  getUserOrDie,
} from "./util"
import { isUuid } from "../../utils"

export function configurePostsRoutes(app: FastifyInstance) {
  app.post<{ Body: Omit<NewPost, "ownerId"> }>("/api/posts", async (req) => {
    const userId = getUserIdOrDie(req)
    const { title, content } = req.body
    if (!postValidation.isPostValid({ title, content })) throw new InvalidRequestError()

    await getActiveMemberOrDie(req, req.body.communityId)

    const res = await postService.createPost({
      ...req.body,
      ownerId: userId,
    })
    if (!res) throw new ServerError()
    return res
  })

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
    if (!post) throw new InvalidRequestError()
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
      if (!post) throw new InvalidRequestError()

      await ensureCommunityMemberIfPrivate(req, post.communityId)

      const res = await postService.addPostComment(req.params.postId, user, req.body.comment)
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
