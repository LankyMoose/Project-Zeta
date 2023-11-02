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
  return resolveSync(req.cookies.user_id, NotAuthenticatedError)
}

export const getUserOrDie = (req: FastifyRequest) => {
  try {
    const userData = resolveSync(req.cookies.user, NotAuthenticatedError)
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
  const member = await resolve(
    communityService.getCommunityMember(communityId, userId),
    UnauthorizedError
  )
  if (member.disabled || member.community.disabled) throw new UnauthorizedError()
  if (member.community.deleted) throw new NotFoundError()
  return member
}

export const ensureCommunityMemberIfPrivate = async (req: FastifyRequest, communityId: string) => {
  const community = await resolve(communityService.getCommunity(communityId, true), NotFoundError)
  if (community.private) await getActiveMemberOrDie(req, community.id)
}

export const ensureCommunityModerator = (member: CommunityMember) => {
  if (["owner", "moderator"].indexOf(member.memberType) === -1) throw new UnauthorizedError()
}

export const ensureCommunityMemberNsfwAgreementOrDie = async (
  userId: string,
  communityId: string
) => {
  await resolve(communityService.getCommunityNsfwAgreement(communityId, userId), NsfwError)
}

type Value<T> = T extends undefined | ApiError ? never : T
type MessageOrErrorCtor = string | { new (msg?: string): ApiError }

export const resolve = async <T>(
  val: Promise<T | void>,
  msgOrErrCtor: MessageOrErrorCtor = ServerError,
  msg?: string
): Promise<Value<T>> => {
  try {
    return resolveSync(await val, msgOrErrCtor, msg) as Value<T>
  } catch (error) {
    console.error("unhandled getOrDie error", error)
    throw new ServerError(msg)
  }
}

export const resolveSync = <T>(
  val: T | void,
  msgOrErrCtor: MessageOrErrorCtor = ServerError,
  msg?: string
): Value<T> => {
  if (!val) {
    if (typeof msgOrErrCtor === "string") throw new ServerError(msgOrErrCtor)
    throw new msgOrErrCtor(msg)
  }
  if (val instanceof ApiError) throw val
  return val as Value<T>
}

export const uuidOrDie = (val: string | void): string => {
  if (!val || !isUuid(val)) throw new InvalidRequestError()
  return val
}
