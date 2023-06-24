import { FastifyInstance } from "fastify"
import { postService } from "../services/postService"
import { NewPost } from "../../db/schema"
import { postValidation } from "../../db/validation"

export function configurePostsRoutes(app: FastifyInstance) {
  app.post<{ Body: NewPost }>("/api/posts", async (req) => {
    if (!req.cookies.user_id) throw new Error("Not logged in")
    const userId = req.cookies.user_id
    if (req.body.ownerId !== userId) throw new Error("Invalid user")

    if (!postValidation.isPostValid(req.body.title, req.body.content))
      throw new Error("Invalid post creation request")

    return await postService.createPost(req.body)
  })
}
