import { FastifyInstance } from "fastify"
import { communityService } from "../services/communityService"
import { getUserIdOrDie } from "./util"
import { InvalidRequestError, ServerError } from "../../errors"
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
    const url = await userService.getUserDisplayPictureUpdateUrl(userId)
    if (!url) throw new ServerError()

    return { url }
  })

  app.get<{ Querystring: { url?: string } }>("/api/me/update-dp/confirm", async (req, reply) => {
    if (!req.query.url) throw new InvalidRequestError()
    const userId = getUserIdOrDie(req)
    const res = await userService.save({
      id: userId,
      avatarUrl: req.query.url,
    })
    if (!res) throw new ServerError()

    reply.setCookie("user", JSON.stringify(res), {
      ...cookieSettings,
      httpOnly: false,
    })
  })

  app.put<{ Body: { name: string } }>("/api/me/name", async (req, reply) => {
    const userId = getUserIdOrDie(req)
    console.log("api/me/name", req.body)
    if (!req.body.name) throw new InvalidRequestError()
    if (!userValidation.isUserNameValid(req.body.name)) throw new InvalidRequestError()

    const res = await userService.save({
      id: userId,
      name: req.body.name,
    })
    if (!res) throw new ServerError()

    reply.setCookie("user", JSON.stringify(res), {
      ...cookieSettings,
      httpOnly: false,
    })

    return res
  })
}
