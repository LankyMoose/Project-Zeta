import { FastifyInstance } from "fastify"
import { postService } from "../services/postService"
import { NewPost } from "../../db/schema"
import { postValidation } from "../../db/validation"
import { InvalidRequestError, NotFoundError, ServerError, UnauthorizedError } from "../../errors"
import { getActiveMemberOrDie, getUserIdOrDie, getUserOrDie } from "./util"
import { communityService } from "../services/communityService"
import { isUuid } from "../../utils"

export function configurePostsRoutes(app: FastifyInstance) {
  app.post<{ Body: NewPost }>("/api/posts", async (req) => {
    const userId = getUserIdOrDie(req)
    if (req.body.ownerId !== userId) throw new UnauthorizedError()

    if (!postValidation.isPostValid(req.body.title, req.body.content))
      throw new InvalidRequestError()

    await getActiveMemberOrDie(req, req.body.communityId)

    const res = await postService.createPost(req.body)
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

    const communityId = postData.communityId
    if (!communityId) throw new ServerError()
    const community = await communityService.getCommunity(communityId, true)
    if (!community) throw new NotFoundError()
    if (community.private) await getActiveMemberOrDie(req, community.id)

    return {
      ...postData,
      comments,
    }
  })

  app.get<{ Params: { postId: string }; Querystring: { offset: string } }>(
    "/api/posts/:postId/comments",
    async (req) => {
      const offset = parseInt(req.query.offset)
      if (!req.params.postId || !isUuid(req.params.postId)) throw new InvalidRequestError()

      if (isNaN(offset)) throw new InvalidRequestError()

      const post = await postService.getPost(req.params.postId)
      if (!post) throw new NotFoundError()

      const community = await communityService.getCommunity(post.communityId, true)
      if (!community) throw new NotFoundError()
      if (community.private) await getActiveMemberOrDie(req, community.id)

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

      await getActiveMemberOrDie(req, post.communityId)

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

      await getActiveMemberOrDie(req, post.communityId)

      const res = await postService.addPostReaction(req.params.postId, userId, req.body.reaction)
      if (!res) throw new ServerError()
      return res
    }
  )
}
