const isDev = process.env.NODE_ENV === "development"

export const API_URL = isDev
  ? "http://localhost:3000/api"
  : "https://zetabase.xyz/api"
