import { FastifyInstance } from "fastify"
import { communityService } from "../services/communityService"
import { NewCommunity } from "../../db/schema"
import { communityValidation } from "../../db/validation"
import {
  ApiError,
  InvalidRequestError,
  NotAuthenticatedError,
  NotFoundError,
  ServerError,
} from "../../errors"
import { JoinResultType } from "../../types/community"

export function configureCommunityRoutes(app: FastifyInstance) {
  app.get<{ Querystring: { page?: number } }>("/api/communities", async (req) => {
    const res = await communityService.getPage(req.query.page)
    if (!res) throw new ServerError()
    return res
  })

  app.get<{ Querystring: { title?: string } }>("/api/communities/search", async (req) => {
    if (!req.query.title) throw new InvalidRequestError()
    const res = await communityService.fuzzySearchCommunity(req.query.title)
    if (!res) throw new ServerError()
    return res
  })

  app.get<{ Params: { id?: string } }>("/api/communities/:id", async (req) => {
    if (!req.params.id) throw new InvalidRequestError()
    const res = await communityService.getCommunity(req.params.id)
    if (!res) throw new NotFoundError()
    let member
    if (req.cookies.user_id) {
      member = await communityService.getCommunityMember(res.id, req.cookies.user_id)
    }

    if (!res.private) return { ...res, memberType: member?.memberType ?? "guest" }
    if (!member)
      return {
        private: true,
        id: res.id,
        title: res.title,
        description: res.description,
      }

    return { ...res, memberType: member.memberType }
  })

  app.post<{ Params: { id?: string } }>("/api/communities/:id/join", async (req) => {
    if (!req.params.id) throw new InvalidRequestError()

    const community = await communityService.getCommunity(req.params.id)
    if (!community) throw new NotFoundError()
    if (!req.cookies.user_id) throw new NotAuthenticatedError()

    const member = await communityService.getCommunityMember(community.id, req.cookies.user_id)
    if (member)
      return { type: member.disabled ? JoinResultType.Banned : JoinResultType.AlreadyJoined }

    const res = community.private
      ? await communityService.submitJoinRequest(community.id, req.cookies.user_id)
      : await communityService.joinCommunity(community.id, req.cookies.user_id)

    if (!res) throw new ServerError("Failed to join community")
    return res
  })

  app.post<{ Body: NewCommunity }>("/api/communities", async (req) => {
    if (!req.cookies.user_id) throw new NotAuthenticatedError()

    const { title, description } = req.body
    const userId = req.cookies.user_id

    if (!communityValidation.isCommunityValid(title, description)) throw new InvalidRequestError()
    if (req.body.url_title) delete req.body.url_title

    const res = await communityService.createCommunity(
      {
        title,
        description,
      },
      userId
    )
    if (res instanceof ApiError) throw res
    if (!res) throw new ServerError("Failed to create community")
    return res
  })

  app.patch<{ Body: Partial<NewCommunity>; Params: { id?: string } }>(
    "/api/communities/:id",
    async (req) => {
      if (!req.cookies.user_id) throw new NotAuthenticatedError()
      if (!req.params.id) throw new InvalidRequestError()
      if (req.body.url_title) delete req.body.url_title

      const communityId = req.params.id
      const userId = req.cookies.user_id

      const { title, description, private: _private } = req.body
      if (!communityValidation.isCommunityValid(title, description)) throw new InvalidRequestError()

      const member = await communityService.getCommunityMember(communityId, userId)
      if (!member || member.memberType !== "owner") throw new NotAuthenticatedError()

      const res = await communityService.updateCommunity(
        {
          title,
          description,
          private: _private,
        },
        communityId
      )
      if (res instanceof ApiError) throw res
      if (!res) throw new ServerError("Failed to update community")
      return res
    }
  )
}
