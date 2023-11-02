import { FastifyInstance } from "fastify"
import { userService } from "../services/userService"
import { uuidOrDie } from "./util"

export function configureUserRoutes(app: FastifyInstance) {
  app.get<{ Querystring: { page?: number } }>("/api/users", async (req) => {
    return userService.getPage(req.query.page)
  })

  app.get<{ Params: { id?: string } }>("/api/users/:id", async (req) => {
    return userService.getById(uuidOrDie(req.params.id))
  })
}
