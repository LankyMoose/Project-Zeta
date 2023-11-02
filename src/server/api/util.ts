import { FastifyRequest } from "fastify"
import {
  InvalidRequestError,
  NotAuthenticatedError,
  NotFoundError,
  NsfwError,
  ServerError,
  UnauthorizedError,
} from "../../errors"
import { PublicUser } from "../../types/user"
import { communityService } from "../services/communityService"
import { CommunityMember } from "../../db/schema"
import { isUuid } from "../../utils"

export const getUserIdOrDie = (req: FastifyRequest) => {
  return valueOrDie(req.cookies.user_id, NotAuthenticatedError)
}

export const getUserOrDie = (req: FastifyRequest) => {
  return JSON.parse(valueOrDie(req.cookies.user, NotAuthenticatedError)) as PublicUser
}

export const getActiveMemberOrDie = async (
  req: FastifyRequest,
  communityId: string
): Promise<CommunityMember> => {
  const userId = getUserIdOrDie(req)
  const member = await getOrDie(
    communityService.getCommunityMember(communityId, userId),
    UnauthorizedError
  )
  if (member.disabled || member.community.disabled) throw new UnauthorizedError()
  if (member.community.deleted) throw new NotFoundError()
  return member
}

export const ensureCommunityMemberIfPrivate = async (req: FastifyRequest, communityId: string) => {
  const community = await getOrDie(communityService.getCommunity(communityId, true), NotFoundError)
  if (community.private) await getActiveMemberOrDie(req, community.id)
}

export const ensureCommunityModerator = (member: CommunityMember) => {
  if (["owner", "moderator"].indexOf(member.memberType) === -1) throw new UnauthorizedError()
}

export const ensureCommunityMemberNsfwAgreementOrDie = async (
  userId: string,
  communityId: string
) => {
  await getOrDie(communityService.getCommunityNsfwAgreement(communityId, userId), NsfwError)
}

export const getOrDie = async <T>(
  val: Promise<T | void>,
  msgOrErrCtor: string | { new (msg?: string): Error } = ServerError,
  msg?: string
): Promise<T extends undefined ? never : T> => {
  const res = await val
  if (!res) {
    if (typeof msgOrErrCtor === "string") throw new ServerError(msgOrErrCtor)
    throw new msgOrErrCtor(msg)
  }
  return res as T extends undefined ? never : T
}

export const valueOrDie = <T>(
  val: T | void,
  errCtor: { new (): Error } = InvalidRequestError
): T extends undefined ? never : T => {
  if (!val) throw new errCtor()
  return val as T extends undefined ? never : T
}

export const uuidOrDie = (val: string | void): string => {
  if (!val || !isUuid(val)) throw new InvalidRequestError()
  return val
}
