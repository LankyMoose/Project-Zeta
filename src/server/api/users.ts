import { FastifyInstance } from "fastify"
import { userService } from "../services/userService"
import { InvalidRequestError } from "../../errors"
import { isUuid } from "../../utils"

export function configureUserRoutes(app: FastifyInstance) {
  app.get<{ Querystring: { page?: number } }>("/api/users", async (req) => {
    const users = await userService.getPage(req.query.page)
    return { users }
  })

  app.get<{ Params: { id?: string } }>("/api/users/:id", async (req) => {
    if (!req.params.id || !isUuid(req.params.id)) throw new InvalidRequestError()
    const user = await userService.getById(req.params.id)
    return { user }
  })
}
