import { FastifyInstance } from "fastify"
import { NotAuthenticatedError } from "../../errors"
import { communityService } from "../services/communityService"

export function configureMeRoutes(app: FastifyInstance) {
  app.get("/api/me/communities", async (req) => {
    if (!req.cookies.user_id) throw new NotAuthenticatedError()

    const [owned, moderated, member] = await Promise.all([
      communityService.getOwnedCommunitiesByUser(req.cookies.user_id),
      communityService.getModeratedCommunitiesByUser(req.cookies.user_id),
      communityService.getMemberCommunitiesByUser(req.cookies.user_id),
    ])
    return {
      owned,
      moderated,
      member,
    }
  })
}
