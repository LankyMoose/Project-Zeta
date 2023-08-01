import { FastifyRequest } from "fastify"
import { NotAuthenticatedError, NotFoundError, UnauthorizedError } from "../../errors"
import { PublicUser } from "../../types/user"
import { communityService } from "../services/communityService"
import { CommunityMember } from "../../db/schema"

export const getUserIdOrDie = (req: FastifyRequest) => {
  if (!req.cookies.user_id) throw new NotAuthenticatedError()
  return req.cookies.user_id
}

export const getUserOrDie = (req: FastifyRequest) => {
  if (!req.cookies.user) throw new NotAuthenticatedError()
  return JSON.parse(req.cookies.user) as PublicUser
}

export const getActiveMemberOrDie = async (
  req: FastifyRequest,
  communityId: string
): Promise<CommunityMember> => {
  const userId = getUserIdOrDie(req)
  const member = await communityService.getCommunityMember(communityId, userId)
  if (!member) throw new UnauthorizedError()
  if (member.disabled || member.community.disabled) throw new UnauthorizedError()
  if (member.community.disabled) throw new UnauthorizedError()
  if (member.community.deleted) throw new NotFoundError()
  return member
}

export const ensureCommunityMemberIfPrivate = async (req: FastifyRequest, communityId: string) => {
  const community = await communityService.getCommunity(communityId, true)
  if (!community) throw new NotFoundError()
  if (community.private) await getActiveMemberOrDie(req, community.id)
}
