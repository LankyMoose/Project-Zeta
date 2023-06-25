import { FastifyInstance } from "fastify"
import { communityService } from "../services/communityService"
import { NewCommunity } from "../../db/schema"
import { communityValidation } from "../../db/validation"
import { ApiError, InvalidRequestError, NotAuthenticatedError, NotFoundError, ServerError } from "../../errors"

export function configureCommunityRoutes(app: FastifyInstance) {
  app.get<{ Querystring: { page?: number } }>("/api/communities", async (req) => {
    const res = await communityService.getPage(req.query.page)
    if (!res) throw new ServerError()
    return res
  })

  app.get<{ Params: { id?: string } }>("/api/communities/:id", async (req) => {
    if (!req.params.id) throw new InvalidRequestError()
    const res = await communityService.getCommunity(req.params.id)

    if (!res) throw new NotFoundError()
    if (!res.private) return res
    if (!req.cookies.user_id) throw new NotAuthenticatedError()

    const error = await communityService.checkCommunityMemberValidity(req.params.id, req.cookies.user_id)
    if (error) throw error

    return res
  })

  app.post<{ Body: NewCommunity }>("/api/communities", async (req) => {
    if (!req.cookies.user_id) throw new NotAuthenticatedError()

    const { title, description } = req.body
    const userId = req.cookies.user_id

    if (!communityValidation.isCommunityValid(title, description)) throw new InvalidRequestError()
    if (req.body.url_title) delete req.body.url_title

    const res = await communityService.createCommunity(
      {
        title,
        description,
      },
      userId
    )
    if (res instanceof ApiError) throw res
    if (!res) throw new ServerError("Failed to create community")
    return res
  })
}
