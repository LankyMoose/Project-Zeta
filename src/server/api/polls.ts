import { FastifyInstance } from "fastify"
import { pollService } from "../services/pollService"
import { NewPoll } from "../../db/schema"
import { RequestUserID } from "../../types/server"

export function configurePollRoutes(app: FastifyInstance) {
  app.get<{ Querystring: { page?: number } }>("/api/polls", async (req) => {
    return await pollService.getPage(req.query.page, 1)
  })

  app.get<{ Params: { id?: string } }>("/api/polls/:id", async (req) => {
    if (!req.params.id) throw new Error("No id provided")
    const parsed = parseInt(req.params.id)
    if (isNaN(parsed)) throw new Error("Invalid id")
    return await pollService.getById(parsed, 1)
  })

  app.post<{ Body: { webId?: string; desc: string; options: string[] } }>(
    "/api/polls",
    async (req) => {
      console.log("req.body", req.body)
      if (!req.cookies.user_id) throw new Error("Not logged in")

      const userId = JSON.parse(req.cookies.user_id) as RequestUserID

      return await pollService.save(
        req.body as NewPoll & { options: string[] },
        userId
      )
    }
  )
}
