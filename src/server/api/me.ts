import { FastifyInstance } from "fastify"
import { communityService } from "../services/communityService"
import { getOrDie, getUserIdOrDie, valueOrDie } from "./util"
import { InvalidRequestError } from "../../errors"
import { userService } from "../services/userService"
import { userValidation } from "../../db/validation"
import { cookieSettings } from "../cookies"

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

  app.get("/api/me/update-dp", async (req) => {
    const userId = getUserIdOrDie(req)
    const url = await getOrDie(userService.getUserDisplayPictureUpdateUrl(userId))
    return { url }
  })

  app.get<{ Querystring: { url?: string } }>("/api/me/update-dp/confirm", async (req, reply) => {
    const userId = getUserIdOrDie(req)
    const res = await getOrDie(
      userService.upsert({
        id: userId,
        avatarUrl: valueOrDie(req.query.url),
      })
    )

    reply.setCookie("user", JSON.stringify(res), {
      ...cookieSettings,
      httpOnly: false,
    })
  })

  app.put<{ Body: { name: string } }>("/api/me/name", async (req, reply) => {
    const userId = getUserIdOrDie(req)
    if (!userValidation.isUserNameValid(valueOrDie(req.body.name))) throw new InvalidRequestError()

    const res = await getOrDie(
      userService.upsert({
        id: userId,
        name: req.body.name,
      })
    )

    reply.setCookie("user", JSON.stringify(res), {
      ...cookieSettings,
      httpOnly: false,
    })

    return res
  })
}
