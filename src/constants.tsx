export const API_URL =
  "window" in globalThis
    ? `${window.location.protocol}${window.location.host}/api`
    : "http://localhost:3000/api"

export enum API_ERROR {
  NOT_FOUND = "Not found",
  NOT_AUTHENTICATED = "Unauthenticated",
  UNAUTHORIZED = "Unauthorized",
  FORBIDDEN = "Forbidden",
  DISABLED = "Disabled",
  INVALID_REQUEST = "Invalid",
  SERVER_ERROR = "Server error",
  COMMUNITY_NAME_NOT_AVAILABLE = "Community name not available",
}
