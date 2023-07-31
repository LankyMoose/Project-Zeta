import { FastifyInstance } from "fastify"
import { postService } from "../services/postService"
import { NewPost } from "../../db/schema"
import { postValidation } from "../../db/validation"
import { InvalidRequestError, ServerError, UnauthorizedError } from "../../errors"
import { getActiveMemberOrDie, getUserIdOrDie, getUserOrDie } from "./util"

export function configurePostsRoutes(app: FastifyInstance) {
  app.post<{ Body: NewPost }>("/api/posts", async (req) => {
    const userId = getUserIdOrDie(req)
    if (req.body.ownerId !== userId) throw new UnauthorizedError()

    if (!postValidation.isPostValid(req.body.title, req.body.content))
      throw new InvalidRequestError()

    await getActiveMemberOrDie(req, req.body.communityId)

    const res = await postService.createPost(req.body)
    if (!res) throw new ServerError()
    return res
  })

  app.post<{ Params: { postId: string }; Body: { comment: string } }>(
    "/api/posts/:postId/comments",
    async (req) => {
      const user = getUserOrDie(req)

      const post = await postService.getPost(req.params.postId)
      if (!post) throw new InvalidRequestError()

      await getActiveMemberOrDie(req, post.communityId)

      const res = await postService.addPostComment(req.params.postId, user, req.body.comment)
      if (!res) throw new ServerError()
      return res
    }
  )

  app.post<{ Params: { postId: string }; Body: { reaction: boolean } }>(
    "/api/posts/:postId/reactions",
    async (req) => {
      const userId = getUserIdOrDie(req)

      const post = await postService.getPost(req.params.postId)
      if (!post) throw new InvalidRequestError()

      await getActiveMemberOrDie(req, post.communityId)

      const res = await postService.addPostReaction(req.params.postId, userId, req.body.reaction)
      if (!res) throw new ServerError()
      return res
    }
  )
}
