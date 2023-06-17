import { FastifyInstance } from "fastify"
import { pollService } from "../services/pollService"

export function configurePollRoutes(app: FastifyInstance) {
  app.get<{ Querystring: { page?: number } }>("/api/polls", async (req) => {
    const polls = await pollService.getPage(req.query.page)
    return { polls }
  })

  app.get<{ Params: { id?: string } }>("/api/polls/:id", async (req) => {
    if (!req.params.id) throw new Error("No id provided")
    const parsed = parseInt(req.params.id)
    if (isNaN(parsed)) throw new Error("Invalid id")
    const poll = await pollService.getById(parsed)
    return { poll }
  })
}
