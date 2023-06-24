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

    const error = await communityService.checkCommunityMemberValidity(
      req.body.communityId,
      userId
    )
    if (error) throw error

    const res = await postService.createPost(req.body)
    if (!res) throw new ServerError()
    return res
  })
}
