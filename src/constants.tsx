const isDev = process.env.NODE_ENV === "development"

export const API_URL = isDev
  ? "http://localhost:3000/api"
  : isDev
  ? "https://project-zeta.up.railway.app/api"
  : "https://zetabase.xyz/api"

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
