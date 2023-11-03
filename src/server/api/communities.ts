import { FastifyInstance } from "fastify"
import { communityService } from "../services/communityService"
import { NewCommunity } from "../../db/schema"
import { communityValidation } from "../../db/validation"
import { InvalidRequestError, NotFoundError, UnauthorizedError } from "../../errors"
import { JoinResultType } from "../../types/community"
import {
  ensureCommunityMemberNsfwAgreementOrDie,
  ensureCommunityModerator,
  getActiveMemberOrDie,
  resolve,
  getUserIdOrDie,
  uuidOrDie,
  resolveSync,
} from "./util"

export function configureCommunityRoutes(app: FastifyInstance) {
  app.get<{ Querystring: { page?: number } }>("/api/communities", async (req) =>
    resolve(communityService.getPage(req.query.page))
  )

  app.get<{ Querystring: { title: string } }>("/api/communities/search", async (req) =>
    resolve(
      communityService.fuzzySearchCommunity(resolveSync(req.query.title, InvalidRequestError))
    )
  )

  app.get<{ Querystring: { page?: number } }>("/api/communities/latest", async (req) =>
    resolve(communityService.getLatestPosts(req.cookies.user_id, req.query.page))
  )

  app.get<{ Params: { url_title: string } }>("/api/communities/:url_title", async (req) => {
    const url_title = resolveSync(req.params.url_title, InvalidRequestError)

    const res = await resolve(communityService.getCommunityWithMembers(url_title), NotFoundError)

    const member = req.cookies.user_id
      ? await communityService.getCommunityMember(res.id, req.cookies.user_id)
      : null

    if (!res.private) return { ...res, memberType: member?.memberType ?? "guest" }
    if (!member) throw new UnauthorizedError()
    if (member.disabled) throw new UnauthorizedError()

    if (res.nsfw) await ensureCommunityMemberNsfwAgreementOrDie(member.userId, res.id)

    return { ...res, memberType: member.memberType }
  })

  app.get<{ Params: { url_title: string } }>("/api/communities/:url_title/posts", async (req) => {
    const community = await resolve(
      communityService.getCommunity(resolveSync(req.params.url_title, InvalidRequestError)),
      NotFoundError
    )

    if (community.private) {
      const member = await getActiveMemberOrDie(req, community.id)
      if (community.nsfw) await ensureCommunityMemberNsfwAgreementOrDie(member.userId, community.id)
    }

    return resolve(communityService.getCommunityPosts(community.id, req.cookies.user_id))
  })

  app.get<{ Params: { communityId: string } }>(
    "/api/communities/:communityId/join-requests",
    async (req) => {
      const communityId = uuidOrDie(req.params.communityId)
      const member = await getActiveMemberOrDie(req, communityId)

      ensureCommunityModerator(member)

      return resolve(communityService.getJoinRequests(communityId))
    }
  )

  app.post<{ Params: { communityId?: string }; Body: { requestId: string; accepted: boolean } }>(
    "/api/communities/:communityId/join-requests",
    async (req) => {
      const communityId = uuidOrDie(req.params.communityId)
      const member = await getActiveMemberOrDie(req, communityId)
      ensureCommunityModerator(member)

      const res = await resolve(
        communityService.respondToJoinRequest(req.body.requestId, req.body.accepted)
      )

      return communityService.getCommunityMemberData(communityId, res.userId)
    }
  )

  app.patch<{
    Params: { communityId: string }
    Body: { userId: string; memberType: "owner" | "moderator" | "member" | "none" }
  }>("/api/communities/:communityId/members", async (req) => {
    const targetUserId = uuidOrDie(req.body.userId)
    const targetNewType = resolveSync(req.body.memberType, InvalidRequestError)
    if (["owner", "moderator", "member", "none"].indexOf(targetNewType) === -1)
      throw new InvalidRequestError()

    const communityId = uuidOrDie(req.params.communityId)
    const member = await getActiveMemberOrDie(req, communityId)
    ensureCommunityModerator(member)

    const targetMember = await resolve(
      communityService.getCommunityMember(communityId, targetUserId),
      NotFoundError
    )

    if (targetNewType === targetMember.memberType)
      return communityService.getCommunityMemberData(communityId, targetUserId)

    if (member.memberType === "moderator") {
      // ensure mods can only affect members
      if (targetMember.memberType !== "member") throw new UnauthorizedError()
      // ensure mods can only demote members to none
      if (targetNewType !== "none") throw new UnauthorizedError()
    }

    if (targetNewType === "none") {
      // delete member record for target member
      await resolve(
        communityService.leaveCommunity(communityId, targetUserId),
        "Failed to leave community"
      )
      return { type: "removed" }
    } else if (targetNewType === "owner") {
      // giving owner status to another user, relegating current owner to moderator
      await Promise.all([
        resolve(
          communityService.updateCommunityMemberType(communityId, targetUserId, "owner"),
          "Failed to update member type"
        ),
        resolve(
          communityService.updateCommunityMemberType(communityId, member.userId, "moderator"),
          "Failed to update member type"
        ),
      ])

      const [newOwner, newMod] = await Promise.all([
        resolve(communityService.getCommunityMemberData(communityId, targetUserId)),
        resolve(communityService.getCommunityMemberData(communityId, member.userId)),
      ])

      return {
        owner: newOwner,
        moderator: newMod,
      }
    } else {
      await resolve(
        communityService.updateCommunityMemberType(communityId, targetUserId, targetNewType)
      )
      return communityService.getCommunityMemberData(communityId, targetUserId)
    }
  })

  app.post<{ Params: { url_title: string } }>(
    "/api/communities/:url_title/nsfw-agreement",
    async (req) => {
      const url_title = resolveSync(req.params.url_title, InvalidRequestError)
      const userId = getUserIdOrDie(req)
      const community = await resolve(communityService.getCommunity(url_title), NotFoundError)

      return resolve(communityService.createNsfwAgreement(community.id, userId))
    }
  )

  app.post<{ Params: { url_title?: string } }>("/api/communities/:url_title/join", async (req) => {
    const url_title = resolveSync(req.params.url_title, InvalidRequestError)
    const userId = getUserIdOrDie(req)

    const community = await resolve(communityService.getCommunity(url_title), NotFoundError)

    const member = await communityService.getCommunityMember(community.id, userId)
    if (member)
      return { type: member.disabled ? JoinResultType.Banned : JoinResultType.AlreadyJoined }

    return resolve(
      community.private
        ? communityService.submitJoinRequest(community.id, userId)
        : communityService.joinCommunity(community.id, userId)
    )
  })

  app.post<{ Params: { communityId: string } }>(
    "/api/communities/:communityId/leave",
    async (req) => {
      const communityId = uuidOrDie(req.params.communityId)
      const userId = getUserIdOrDie(req)

      return resolve(communityService.leaveCommunity(communityId, userId))
    }
  )

  app.post<{ Body: NewCommunity }>("/api/communities", async (req) => {
    const userId = getUserIdOrDie(req)

    const { title, description, private: _private, nsfw } = req.body

    if (!communityValidation.isCommunityValid(req.body)) throw new InvalidRequestError()
    if (req.body.url_title) delete req.body.url_title

    const res = await resolve(
      communityService.createCommunity(
        {
          title,
          description,
          private: _private,
          nsfw,
        },
        userId
      )
    )
    return res
  })

  app.patch<{ Body: Partial<NewCommunity>; Params: { communityId?: string } }>(
    "/api/communities/:communityId",
    async (req) => {
      const communityId = uuidOrDie(req.params.communityId)

      if (req.body.url_title) delete req.body.url_title
      const { title, description, private: _private, nsfw } = req.body
      if (!communityValidation.isCommunityValid(req.body)) throw new InvalidRequestError()

      const member = await getActiveMemberOrDie(req, communityId)
      if (member.memberType !== "owner") throw new UnauthorizedError()

      const res = await resolve(
        communityService.updateCommunity(
          {
            title,
            description,
            private: _private,
            nsfw,
          },
          communityId
        )
      )
      if (res.nsfw) await communityService.createNsfwAgreement(res.id, member.userId)

      return res
    }
  )
  app.delete<{ Params: { communityId?: string } }>("/api/communities/:communityId", async (req) => {
    const communityId = uuidOrDie(req.params.communityId)

    const member = await getActiveMemberOrDie(req, communityId)
    if (member.memberType !== "owner") throw new UnauthorizedError()

    return resolve(communityService.deleteCommunity(communityId))
  })
}
