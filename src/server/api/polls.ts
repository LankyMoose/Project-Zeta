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

  app.post<{ Body: { desc: string; options: string[] } }>(
    "/api/polls",
    async (req) => {
      if (!req.cookies.user_id) throw new Error("Not logged in")

      const userId = req.cookies.user_id

      const res = await pollService.save(
        req.body as NewPoll & { options: string[] },
        userId
      )
      app.websocketServer?.clients.forEach(function each(client: any) {
        client.send(JSON.stringify({ type: "+poll", data: res }))
      })
      return res
    }
  )

  app.post<{ Params: { pollId: string; optionId: string } }>(
    "/api/polls/:pollId/vote/:optionId",
    async (req) => {
      if (!req.cookies.user_id) throw new Error("Not logged in")
      const { pollId, optionId } = req.params
      const res = await pollService.vote(pollId, optionId, req.cookies.user_id)
      app.websocketServer?.clients.forEach(function each(client: any) {
        client.send(
          JSON.stringify({
            type: "~voteCounts",
            data: {
              id: pollId,
              voteCounts: res,
            },
          })
        )
      })

      return res
    }
  )
}
