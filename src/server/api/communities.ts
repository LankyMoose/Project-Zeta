import { FastifyInstance } from "fastify"
import { communityService } from "../services/communityService"
import { NewCommunity } from "../../db/schema"
import { communityValidation } from "../../db/validation"

export function configureCommunityRoutes(app: FastifyInstance) {
  app.get<{ Querystring: { page?: number } }>(
    "/api/communities",
    async (req) => {
      return await communityService.getPage(req.query.page)
    }
  )

  app.get<{ Params: { id?: string } }>("/api/communities/:id", async (req) => {
    if (!req.params.id) throw new Error("No id provided")
    return await communityService.getCommunity(req.params.id)
  })

  app.post<{ Body: NewCommunity }>("/api/communities", async (req) => {
    if (!req.cookies.user_id) throw new Error("Not logged in")
    const { title, description } = req.body
    const userId = req.cookies.user_id

    if (!communityValidation.isCommunityValid(title, description)) {
      throw new Error("Invalid community creation request")
    }
    return await communityService.createCommunity(
      {
        title,
        description,
      },
      userId
    )
  })
}
