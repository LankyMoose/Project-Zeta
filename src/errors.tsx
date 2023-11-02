import { FastifyError, ValidationResult } from "fastify"
import { SchemaErrorDataVar } from "fastify/types/schema"
import { API_ERROR } from "./constants"

export abstract class ApiError extends Error implements FastifyError {
  code: string
  name: string
  statusCode?: number | undefined
  validation?: ValidationResult[] | undefined
  validationContext?: SchemaErrorDataVar | undefined
  message: string
  stack?: string | undefined
  cause?: unknown

  constructor(code: string, message: API_ERROR | string, statusCode?: number) {
    super(message)
    this.code = code
    this.name = code
    this.message = message
    this.statusCode = statusCode
  }
}

export class InvalidRequestError extends ApiError {
  constructor(message?: string) {
    super("VALIDATION_ERROR", message ?? API_ERROR.INVALID_REQUEST, 400)
  }
}
export class NotFoundError extends ApiError {
  constructor(message?: string) {
    super("NOT_FOUND", message ?? API_ERROR.NOT_FOUND, 404)
  }
}
export class NotAuthenticatedError extends ApiError {
  constructor(message?: string) {
    super("NOT_AUTHENTICATED", message ?? API_ERROR.NOT_AUTHENTICATED, 401)
  }
}
export class UnauthorizedError extends ApiError {
  constructor(message?: string) {
    super("UNAUTHORIZED", message ?? API_ERROR.UNAUTHORIZED, 403)
  }
}
export class ForbiddenError extends ApiError {
  constructor(message?: string) {
    super("FORBIDDEN", message ?? API_ERROR.FORBIDDEN, 403)
  }
}
export class DisabledError extends ApiError {
  constructor(message?: string) {
    super("DISABLED", message ?? API_ERROR.DISABLED, 403)
  }
}
export class NsfwError extends ApiError {
  constructor(message?: string) {
    super("NSFW", message ?? API_ERROR.NSFW, 403)
  }
}

export class ServerError extends ApiError {
  constructor(message?: string) {
    super("SERVER_ERROR", message ?? API_ERROR.SERVER_ERROR, 500)
  }
}

export class CommunityNameNotAvailableError extends ApiError {
  constructor(message?: string) {
    super("COMMUNITY_NAME_NOT_AVAILABLE", message ?? API_ERROR.COMMUNITY_NAME_NOT_AVAILABLE, 400)
  }
}
