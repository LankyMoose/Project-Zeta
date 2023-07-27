import { API_ERROR } from "./constants";
export class ApiError {
    constructor(code, message, statusCode) {
        Object.defineProperty(this, "code", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "statusCode", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "validation", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "validationContext", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "message", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "stack", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "cause", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.code = code;
        this.name = code;
        this.message = message;
        this.statusCode = statusCode;
    }
}
export class InvalidRequestError extends ApiError {
    constructor(message) {
        super("VALIDATION_ERROR", message ?? API_ERROR.INVALID_REQUEST, 400);
    }
}
export class NotFoundError extends ApiError {
    constructor(message) {
        super("NOT_FOUND", message ?? API_ERROR.NOT_FOUND, 404);
    }
}
export class NotAuthenticatedError extends ApiError {
    constructor(message) {
        super("NOT_AUTHENTICATED", message ?? API_ERROR.NOT_AUTHENTICATED, 401);
    }
}
export class UnauthorizedError extends ApiError {
    constructor(message) {
        super("UNAUTHORIZED", message ?? API_ERROR.UNAUTHORIZED, 403);
    }
}
export class ForbiddenError extends ApiError {
    constructor(message) {
        super("FORBIDDEN", message ?? API_ERROR.FORBIDDEN, 403);
    }
}
export class DisabledError extends ApiError {
    constructor(message) {
        super("DISABLED", message ?? API_ERROR.DISABLED, 403);
    }
}
export class ServerError extends ApiError {
    constructor(message) {
        super("SERVER_ERROR", message ?? API_ERROR.SERVER_ERROR, 500);
    }
}
export class CommunityNameNotAvailableError extends ApiError {
    constructor(message) {
        super("COMMUNITY_NAME_NOT_AVAILABLE", message ?? API_ERROR.COMMUNITY_NAME_NOT_AVAILABLE, 400);
    }
}
