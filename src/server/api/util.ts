import { FastifyRequest } from "fastify"
import {
  ApiError,
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
  try {
    const userData = valueOrDie(req.cookies.user, NotAuthenticatedError)
    return JSON.parse(userData) as PublicUser
  } catch (error) {
    if (error instanceof ApiError) throw error
    throw new ServerError()
  }
}

export const getActiveMemberOrDie = async (
  req: FastifyRequest,
  communityId: string
): Promise<CommunityMember> => {
  const userId = getUserIdOrDie(req)
  const member = await resolveOrDie(
    communityService.getCommunityMember(communityId, userId),
    UnauthorizedError
  )
  if (member.disabled || member.community.disabled) throw new UnauthorizedError()
  if (member.community.deleted) throw new NotFoundError()
  return member
}

export const ensureCommunityMemberIfPrivate = async (req: FastifyRequest, communityId: string) => {
  const community = await resolveOrDie(
    communityService.getCommunity(communityId, true),
    NotFoundError
  )
  if (community.private) await getActiveMemberOrDie(req, community.id)
}

export const ensureCommunityModerator = (member: CommunityMember) => {
  if (["owner", "moderator"].indexOf(member.memberType) === -1) throw new UnauthorizedError()
}

export const ensureCommunityMemberNsfwAgreementOrDie = async (
  userId: string,
  communityId: string
) => {
  await resolveOrDie(communityService.getCommunityNsfwAgreement(communityId, userId), NsfwError)
}

type Value<T> = T extends undefined | ApiError ? never : T

export const resolveOrDie = async <T>(
  val: Promise<T | void>,
  msgOrErrCtor: string | { new (msg?: string): Error } = ServerError,
  msg?: string
): Promise<Value<T>> => {
  try {
    const res = await val
    if (!res) {
      if (typeof msgOrErrCtor === "string") throw new ServerError(msgOrErrCtor)
      throw new msgOrErrCtor(msg)
    }
    if (res instanceof ApiError) throw res
    return res as Value<T>
  } catch (error) {
    console.error("unhandled getOrDie error", error)
    throw new ServerError(msg)
  }
}

export const valueOrDie = <T>(
  val: T | void,
  msgOrErrCtor: string | { new (msg?: string): Error } = InvalidRequestError,
  msg?: string
): Value<T> => {
  if (!val) {
    if (typeof msgOrErrCtor === "string") throw new InvalidRequestError(msgOrErrCtor)
    throw new msgOrErrCtor(msg)
  }
  if (val instanceof ApiError) throw val
  return val as Value<T>
}

export const uuidOrDie = (val: string | void): string => {
  if (!val || !isUuid(val)) throw new InvalidRequestError()
  return val
}
