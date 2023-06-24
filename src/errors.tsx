import { FastifyError, ValidationResult } from "fastify"
import { SchemaErrorDataVar } from "fastify/types/schema"
import { API_ERROR } from "./constants"

export class ApiError implements FastifyError {
  code: string
  name: string
  statusCode?: number | undefined
  validation?: ValidationResult[] | undefined
  validationContext?: SchemaErrorDataVar | undefined
  message: string
  stack?: string | undefined
  cause?: unknown

  constructor(code: string, message: API_ERROR, statusCode?: number) {
    this.code = code
    this.name = code
    this.message = message
    this.statusCode = statusCode
  }
}

export class InvalidRequestError extends ApiError {
  constructor() {
    super("VALIDATION_ERROR", API_ERROR.INVALID_REQUEST, 400)
  }
}
export class NotFoundError extends ApiError {
  constructor() {
    super("NOT_FOUND", API_ERROR.NOT_FOUND, 404)
  }
}
export class NotAuthenticatedError extends ApiError {
  constructor() {
    super("NOT_AUTHENTICATED", API_ERROR.NOT_AUTHENTICATED, 401)
  }
}
export class UnauthorizedError extends ApiError {
  constructor() {
    super("UNAUTHORIZED", API_ERROR.UNAUTHORIZED, 403)
  }
}
export class ForbiddenError extends ApiError {
  constructor() {
    super("FORBIDDEN", API_ERROR.FORBIDDEN, 403)
  }
}
export class DisabledError extends ApiError {
  constructor() {
    super("DISABLED", API_ERROR.DISABLED, 403)
  }
}
export class ServerError extends ApiError {
  constructor() {
    super("SERVER_ERROR", API_ERROR.SERVER_ERROR, 500)
  }
}
