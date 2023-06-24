const isDev = process.env.NODE_ENV === "development"

export const API_URL = isDev
  ? "http://localhost:3000/api"
  : "https://zetabase.xyz/api"

export enum API_ERROR {
  NOT_FOUND = "Not found",
  NOT_AUTHENTICATED = "Unauthenticated",
  UNAUTHORIZED = "Unauthorized",
  FORBIDDEN = "Forbidden",
  DISABLED = "Disabled",
  INVALID_REQUEST = "Invalid",
  SERVER_ERROR = "Server error",
}
