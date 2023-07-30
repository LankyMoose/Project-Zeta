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
  UnauthorizedError,
} from "../../errors"
import { JoinResultType } from "../../types/community"
import { postService } from "../services/postService"

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

  app.get<{ Params: { id?: string } }>("/api/communities/:id", async (req) => {
    if (!req.params.id) throw new InvalidRequestError()
    const res = await communityService.getCommunityWithMembers(req.params.id)
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

  app.get<{ Params: { id?: string } }>("/api/communities/:id/posts", async (req) => {
    if (!req.params.id) throw new InvalidRequestError()
    const community = await communityService.getCommunity(req.params.id)
    if (!community) throw new NotFoundError()

    const res = await communityService.getCommunityPosts(community.id, req.cookies.user_id)
    if (!res) throw new ServerError()
    return res
  })

  app.get<{ Params: { id?: string; postId: string } }>(
    "/api/communities/:id/posts/:postId",
    async (req) => {
      const communityId = req.params.id
      const postId = req.params.postId
      if (!communityId || !postId) throw new InvalidRequestError()

      const community = await communityService.getCommunity(communityId, true)
      if (!community) {
        console.log("not found", postId)
        throw new NotFoundError()
      }

      if (community.private) {
        if (!req.cookies.user_id) throw new NotAuthenticatedError()
        const error = await communityService.checkCommunityMemberValidity(
          community.id,
          req.cookies.user_id
        )
        if (error) throw error
      }

      const [postData, comments] = await Promise.all([
        communityService.getCommunityPost(postId, req.cookies.user_id),
        postService.getPostComments(postId, 0),
      ])

      if (!postData || !comments) throw new ServerError()
      return {
        ...postData,
        comments,
      }
    }
  )

  app.get<{ Params: { id?: string; postId: string }; Querystring: { offset: string } }>(
    "/api/communities/:id/posts/:postId/comments",
    async (req) => {
      const offset = parseInt(req.query.offset)
      const communityId = req.params.id
      const postId = req.params.postId
      if (!communityId || !postId) throw new InvalidRequestError()
      if (isNaN(offset)) throw new InvalidRequestError()

      const community = await communityService.getCommunity(communityId, true)
      if (!community) throw new NotFoundError()

      if (community.private) {
        if (!req.cookies.user_id) throw new NotAuthenticatedError()

        const error = await communityService.checkCommunityMemberValidity(
          community.id,
          req.cookies.user_id
        )
        if (error) throw error
      }

      const res = await postService.getPostComments(req.params.postId, offset)
      if (!res) throw new ServerError()
      return res
    }
  )

  app.get<{ Params: { id?: string } }>("/api/communities/:id/join-requests", async (req) => {
    if (!req.params.id) throw new InvalidRequestError()
    if (!req.cookies.user_id) throw new NotAuthenticatedError()

    const member = await communityService.getCommunityMember(req.params.id, req.cookies.user_id)
    if (!member || ["owner", "moderator"].indexOf(member.memberType) === -1)
      throw new UnauthorizedError()

    const res = await communityService.getJoinRequests(req.params.id)
    if (!res) throw new ServerError()
    return res
  })

  app.post<{ Params: { id?: string }; Body: { requestId: string; accepted: boolean } }>(
    "/api/communities/:id/join-requests",
    async (req) => {
      if (!req.params.id) throw new InvalidRequestError()
      if (!req.cookies.user_id) throw new NotAuthenticatedError()

      const member = await communityService.getCommunityMember(req.params.id, req.cookies.user_id)
      if (!member || ["owner", "moderator"].indexOf(member.memberType) === -1)
        throw new UnauthorizedError()

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
    if (!req.params.id) throw new InvalidRequestError()
    if (!req.cookies.user_id) throw new NotAuthenticatedError()

    const member = await communityService.getCommunityMember(req.params.id, req.cookies.user_id)
    if (!member || ["owner", "moderator", "member", "none"].indexOf(member.memberType) === -1)
      throw new UnauthorizedError()

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
      // handle owner change
      return
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

  app.post<{ Params: { id?: string } }>("/api/communities/:id/leave", async (req) => {
    if (!req.params.id) throw new InvalidRequestError()
    if (!req.cookies.user_id) throw new NotAuthenticatedError()

    const res = await communityService.leaveCommunity(req.params.id, req.cookies.user_id)
    if (!res) throw new ServerError("Failed to leave community")
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
  app.delete<{ Params: { id?: string } }>("/api/communities/:id", async (req) => {
    if (!req.cookies.user_id) throw new NotAuthenticatedError()
    if (!req.params.id) throw new InvalidRequestError()

    const communityId = req.params.id
    const userId = req.cookies.user_id

    const member = await communityService.getCommunityMember(communityId, userId)
    if (!member || member.memberType !== "owner") throw new UnauthorizedError()

    const res = await communityService.deleteCommunity(communityId)
    if (!res) throw new ServerError("Failed to delete community")
    return res
  })
}
