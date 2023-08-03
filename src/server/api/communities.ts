import { FastifyInstance } from "fastify"
import { communityService } from "../services/communityService"
import { NewCommunity } from "../../db/schema"
import { communityValidation } from "../../db/validation"
import {
  ApiError,
  DisabledError,
  InvalidRequestError,
  NotAuthenticatedError,
  NotFoundError,
  ServerError,
  UnauthorizedError,
} from "../../errors"
import { JoinResultType } from "../../types/community"
import {
  ensureCommunityMemberNsfwAgreementOrDie,
  getActiveMemberOrDie,
  getUserIdOrDie,
} from "./util"
import { isUuid } from "../../utils"

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

  app.get<{ Querystring: { page?: number } }>("/api/communities/latest", async (req) => {
    const res = await communityService.getLatestPosts(req.cookies.user_id, req.query.page)
    if (!res) throw new ServerError()
    return res
  })

  app.get<{ Params: { url_title?: string } }>("/api/communities/:url_title", async (req) => {
    if (!req.params.url_title) throw new InvalidRequestError()
    const res = await communityService.getCommunityWithMembers(req.params.url_title)
    if (!res) throw new NotFoundError()
    let member
    if (req.cookies.user_id) {
      member = await communityService.getCommunityMember(res.id, req.cookies.user_id)
    }

    if (!res.private) return { ...res, memberType: member?.memberType ?? "guest" }
    if (!req.cookies.user_id) throw new NotAuthenticatedError()
    if (!member) throw new UnauthorizedError()
    if (member.disabled) throw new DisabledError()

    if (res.nsfw) await ensureCommunityMemberNsfwAgreementOrDie(member.userId, res.id)

    return { ...res, memberType: member.memberType }
  })

  app.get<{ Params: { url_title?: string } }>("/api/communities/:url_title/posts", async (req) => {
    if (!req.params.url_title) throw new InvalidRequestError()

    const community = await communityService.getCommunity(req.params.url_title)
    if (!community) throw new NotFoundError()
    if (community.private) {
      const member = await getActiveMemberOrDie(req, community.id)
      if (community.nsfw) await ensureCommunityMemberNsfwAgreementOrDie(member.userId, community.id)
    }

    const res = await communityService.getCommunityPosts(community.id, req.cookies.user_id)
    if (!res) throw new ServerError()
    return res
  })

  app.get<{ Params: { id?: string } }>("/api/communities/:id/join-requests", async (req) => {
    if (!req.params.id) throw new InvalidRequestError()

    const member = await getActiveMemberOrDie(req, req.params.id)
    if (["owner", "moderator"].indexOf(member.memberType) === -1) throw new UnauthorizedError()

    const res = await communityService.getJoinRequests(req.params.id)
    if (!res) throw new ServerError()
    return res
  })

  app.post<{ Params: { id?: string }; Body: { requestId: string; accepted: boolean } }>(
    "/api/communities/:id/join-requests",
    async (req) => {
      if (!req.params.id || !isUuid(req.params.id)) throw new InvalidRequestError()

      const member = await getActiveMemberOrDie(req, req.params.id)
      if (["owner", "moderator"].indexOf(member.memberType) === -1) throw new UnauthorizedError()

      const res = await communityService.respondToJoinRequest(req.body.requestId, req.body.accepted)
      if (!res) throw new ServerError()
      if (res instanceof ApiError) throw res

      return await communityService.getCommunityMemberData(req.params.id, res.userId)
    }
  )

  app.patch<{
    Params: { id?: string }
    Body: { userId: string; memberType: "owner" | "moderator" | "member" | "none" }
  }>("/api/communities/:id/members", async (req) => {
    if (!req.params.id || !isUuid(req.params.id)) throw new InvalidRequestError()

    const member = await getActiveMemberOrDie(req, req.params.id)
    if (["owner", "moderator"].indexOf(member.memberType) === -1) throw new UnauthorizedError()

    const targetMember = await communityService.getCommunityMember(req.params.id, req.body.userId)
    if (!targetMember) throw new NotFoundError()

    if (req.body.memberType === targetMember.memberType)
      return communityService.getCommunityMemberData(req.params.id, req.body.userId)

    // ensure mods can only remove members
    if (member.memberType === "moderator") {
      if (req.body.memberType !== "none") throw new UnauthorizedError()
      if (targetMember.memberType !== "member") throw new UnauthorizedError()
    }

    if (req.body.memberType === "none") {
      // delete member record for target member
      const res = await communityService.leaveCommunity(req.params.id, req.body.userId)
      if (!res) throw new ServerError("Failed to leave community")
      return { type: "removed" }
    } else if (req.body.memberType === "owner") {
      const res = await communityService.updateCommunityMemberType(
        req.params.id,
        req.body.userId,
        req.body.memberType
      )
      if (!res) throw new ServerError("Failed to update member type")
      const res2 = await communityService.updateCommunityMemberType(
        req.params.id,
        member.userId,
        "moderator"
      )
      if (!res2) throw new ServerError("Failed to update member type")

      const newOwner = await communityService.getCommunityMemberData(req.params.id, req.body.userId)
      if (!newOwner) throw new ServerError("Failed to update member type")
      const newMod = await communityService.getCommunityMemberData(req.params.id, member.userId)
      if (!newMod) throw new ServerError("Failed to update member type")

      return {
        owner: newOwner,
        moderator: newMod,
      }
    } else {
      const res = await communityService.updateCommunityMemberType(
        req.params.id,
        req.body.userId,
        req.body.memberType
      )
      if (!res) throw new ServerError("Failed to update member type")
      return communityService.getCommunityMemberData(req.params.id, req.body.userId)
    }
  })

  app.post<{ Params: { url_title?: string } }>(
    "/api/communities/:url_title/nsfw-agreement",
    async (req) => {
      if (!req.params.url_title) throw new InvalidRequestError()
      const userId = getUserIdOrDie(req)

      const community = await communityService.getCommunity(req.params.url_title)
      if (!community) throw new NotFoundError()

      const res = await communityService.createNsfwAgreement(community.id, userId)
      if (!res) throw new ServerError("Failed to agree to community nsfw")
      return res
    }
  )

  app.post<{ Params: { url_title?: string } }>("/api/communities/:url_title/join", async (req) => {
    if (!req.params.url_title) throw new InvalidRequestError()
    const userId = getUserIdOrDie(req)

    const community = await communityService.getCommunity(req.params.url_title)
    if (!community) throw new NotFoundError()

    const member = await communityService.getCommunityMember(community.id, userId)
    if (member)
      return { type: member.disabled ? JoinResultType.Banned : JoinResultType.AlreadyJoined }

    const res = community.private
      ? await communityService.submitJoinRequest(community.id, userId)
      : await communityService.joinCommunity(community.id, userId)

    if (!res) throw new ServerError("Failed to join community")
    return res
  })

  app.post<{ Params: { id?: string } }>("/api/communities/:id/leave", async (req) => {
    if (!req.params.id || !isUuid(req.params.id)) throw new InvalidRequestError()
    const userId = getUserIdOrDie(req)

    const res = await communityService.leaveCommunity(req.params.id, userId)
    if (!res) throw new ServerError("Failed to leave community")
    return res
  })

  app.post<{ Body: NewCommunity }>("/api/communities", async (req) => {
    const userId = getUserIdOrDie(req)

    const { title, description, private: _private, nsfw } = req.body

    if (!communityValidation.isCommunityValid(req.body)) throw new InvalidRequestError()
    if (req.body.url_title) delete req.body.url_title

    const res = await communityService.createCommunity(
      {
        title,
        description,
        private: _private,
        nsfw,
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
      if (!req.params.id || !isUuid(req.params.id)) throw new InvalidRequestError()
      if (req.body.url_title) delete req.body.url_title
      const { title, description, private: _private, nsfw } = req.body
      if (!communityValidation.isCommunityValid(req.body)) throw new InvalidRequestError()

      const member = await getActiveMemberOrDie(req, req.params.id)
      if (member.memberType !== "owner") throw new UnauthorizedError()

      const res = await communityService.updateCommunity(
        {
          title,
          description,
          private: _private,
          nsfw,
        },
        req.params.id
      )
      if (res instanceof ApiError) throw res
      if (!res) throw new ServerError("Failed to update community")
      if (res.nsfw) await communityService.createNsfwAgreement(res.id, member.userId)

      return res
    }
  )
  app.delete<{ Params: { id?: string } }>("/api/communities/:id", async (req) => {
    if (!req.params.id || !isUuid(req.params.id)) throw new InvalidRequestError()

    const member = await getActiveMemberOrDie(req, req.params.id)
    if (member.memberType !== "owner") throw new UnauthorizedError()

    const res = await communityService.deleteCommunity(req.params.id)
    if (!res) throw new ServerError("Failed to delete community")
    return res
  })
}
