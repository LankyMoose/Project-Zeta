import { FastifyInstance } from "fastify"
import { communityService } from "../services/communityService"
import { getUserIdOrDie } from "./util"

export function configureMeRoutes(app: FastifyInstance) {
  app.get("/api/me/communities", async (req) => {
    const userId = getUserIdOrDie(req)

    const [owned, moderated, member] = await Promise.all([
      communityService.getUserCommunitiesByMemberType(userId, "owner"),
      communityService.getUserCommunitiesByMemberType(userId, "moderator"),
      communityService.getUserCommunitiesByMemberType(userId, "member"),
    ])
    return {
      owned,
      moderated,
      member,
    }
  })
}
