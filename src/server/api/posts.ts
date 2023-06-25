import { FastifyInstance } from "fastify"
import { postService } from "../services/postService"
import { NewPost } from "../../db/schema"
import { postValidation } from "../../db/validation"
import {
  InvalidRequestError,
  NotAuthenticatedError,
  ServerError,
  UnauthorizedError,
} from "../../errors"
import { communityService } from "../services/communityService"

export function configurePostsRoutes(app: FastifyInstance) {
  app.post<{ Body: NewPost }>("/api/posts", async (req) => {
    if (!req.cookies.user_id) throw new NotAuthenticatedError()
    const userId = req.cookies.user_id
    if (req.body.ownerId !== userId) throw new UnauthorizedError()

    if (!postValidation.isPostValid(req.body.title, req.body.content))
      throw new InvalidRequestError()

    const error = await communityService.checkCommunityMemberValidity(req.body.communityId, userId)
    if (error) throw error

    const res = await postService.createPost(req.body)
    if (!res) throw new ServerError()
    return res
  })

  app.post<{ Params: { postId: string }; Body: { comment: string } }>(
    "/api/posts/:postId/comments",
    async (req) => {
      if (!req.cookies.user_id) throw new NotAuthenticatedError()
      const userId = req.cookies.user_id

      const post = await postService.getPost(req.params.postId)
      if (!post) throw new InvalidRequestError()

      const error = await communityService.checkCommunityMemberValidity(post.communityId, userId)
      if (error) throw error

      const res = await postService.addPostComment(req.params.postId, userId, req.body.comment)
      if (!res) throw new ServerError()
      return res
    }
  )

  app.post<{ Params: { postId: string }; Body: { reaction: boolean } }>(
    "/api/posts/:postId/reactions",
    async (req) => {
      if (!req.cookies.user_id) throw new NotAuthenticatedError()
      const userId = req.cookies.user_id

      const post = await postService.getPost(req.params.postId)
      if (!post) throw new InvalidRequestError()

      const error = await communityService.checkCommunityMemberValidity(post.communityId, userId)
      if (error) throw error

      const res = await postService.addPostReaction(req.params.postId, userId, req.body.reaction)
      if (!res) throw new ServerError()
      return res
    }
  )

  app.get<{ Params: { postId: string } }>("/api/posts/:postId", async (req) => {
    const res = await postService.getPost(req.params.postId)
    if (!res) throw new ServerError()
    return res
  })
}
