import { FastifyInstance } from "fastify"
import { pollService } from "../services/pollService"
import { NewPoll } from "../../db/schema"

export function configurePollRoutes(app: FastifyInstance) {
  app.get<{ Querystring: { page?: number } }>("/api/polls", async (req) => {
    return await pollService.getPage(
      req.query.page,
      req.cookies.user_id ?? null
    )
  })

  app.get<{ Params: { id?: string } }>("/api/polls/:id", async (req) => {
    if (!req.params.id) throw new Error("No id provided")
    return await pollService.getById(req.params.id, req.cookies.user_id ?? null)
  })

  app.post<{ Body: { id?: string; desc: string; options: string[] } }>(
    "/api/polls",
    async (req) => {
      if (!req.cookies.user_id) throw new Error("Not logged in")

      const userId = req.cookies.user_id

      return await pollService.save(
        req.body as NewPoll & { options: string[] },
        userId
      )
    }
  )
}
