import { CookieSerializeOptions } from "@fastify/cookie"
import { env } from "../env"

const isDev = process.env.NODE_ENV === "development"

export const cookieSettings: Partial<CookieSerializeOptions> = {
  domain: env.domain || "localhost",
  path: "/",
  sameSite: "lax",
  secure: !isDev,
}
