import path from "path"
import { fileURLToPath } from "url"
import fetch from "node-fetch"

import fastify, { FastifyRequest } from "fastify"
import cookie, { CookieSerializeOptions } from "@fastify/cookie"
import compress from "@fastify/compress"
import fStatic from "@fastify/static"
import websocket from "@fastify/websocket"

import oauthPlugin, { OAuth2Namespace } from "@fastify/oauth2"

import { SSR } from "cinnabun/ssr"
import { Cinnabun } from "cinnabun"
import { log } from "../../.cb/logger.js"

import { Document } from "../app/Document.jsx"
import { App } from "../app/App.jsx"

import { env } from "../env.js"
import { authService } from "./services/authService.js"
import { socketHandler } from "./socket.js"
import { generateUUID } from "../utils.js"

import { configureCommunityRoutes } from "./api/communities.js"
import { configurePostsRoutes } from "./api/posts.js"
import { configureUserRoutes } from "./api/users.js"
import { configureMeRoutes } from "./api/me.js"

import { InvalidRequestError, ServerError } from "../errors.jsx"
import { AuthModalCallbackStateSerialized, AuthProvider } from "../types/auth.js"

const _fetch = globalThis.fetch ?? fetch
globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit | undefined) => {
  try {
    if (typeof input === "string" && input.startsWith("/")) {
      input = `${env.url}${input}`
    }

    return await _fetch(input, init)
  } catch (error) {
    console.error(error)
    throw error
  }
}

const isDev = process.env.NODE_ENV === "development"

declare module "fastify" {
  export interface FastifyInstance {
    authenticate: {
      (request: FastifyRequest, reply: FastifyReply): Promise<void>
    }
    googleOAuth2: OAuth2Namespace
    githubOAuth2: OAuth2Namespace
  }
  interface Session {
    authCallback: string
    id?: number
  }
}

const cookieSettings: Partial<CookieSerializeOptions> = {
  domain: env.domain || "localhost",
  path: "/",
  sameSite: "lax",
  secure: !isDev,
}

const app = fastify()
  .register(cookie)
  .register(compress, { global: false })
  .register(fStatic, {
    prefix: "/static/",
    root: path.join(path.dirname(fileURLToPath(import.meta.url)), "../../dist/static"),
  })
  .register(websocket, {
    options: { maxPayload: 1024 },
  })
  .register(async () => {
    app.route({
      method: "GET",
      url: "/ws",
      handler: (_, res) => res.status(400).send(),
      wsHandler: socketHandler,
    })
  })
  .register(oauthPlugin, {
    name: "googleOAuth2",
    credentials: {
      client: {
        id: env.auth0.google.clientId!,
        secret: env.auth0.google.clientSecret!,
      },
      auth: oauthPlugin.GOOGLE_CONFIGURATION,
    },
    scope: ["profile", "email", "openid"],
    startRedirectPath: "/login/google",
    callbackUri: `${env.url}/login/google/callback`,
    generateStateFunction: (
      request: FastifyRequest<{ Querystring: AuthModalCallbackStateSerialized }>
    ) => {
      const { viewcommunity, viewpost, createcommunity, createpost } = request.query
      const state = JSON.stringify({ viewcommunity, viewpost, createcommunity, createpost })
      return state
    },
    checkStateFunction: (
      _request: FastifyRequest<{ Querystring: AuthModalCallbackStateSerialized }>,
      callback: { (): void }
    ) => {
      callback()
    },
  })
  .register(oauthPlugin, {
    name: "githubOAuth2",
    credentials: {
      client: {
        id: env.auth0.github.clientId!,
        secret: env.auth0.github.clientSecret!,
      },
      auth: oauthPlugin.GITHUB_CONFIGURATION,
    },
    scope: [],
    startRedirectPath: "/login/github",
    callbackUri: `${env.url}/login/github/callback`,
    generateStateFunction: (
      request: FastifyRequest<{ Querystring: AuthModalCallbackStateSerialized }>
    ) => {
      const { viewcommunity, viewpost, createcommunity, createpost } = request.query
      const state = JSON.stringify({ viewcommunity, viewpost, createcommunity, createpost })
      return state
    },
    checkStateFunction: (
      _request: FastifyRequest<{ Querystring: AuthModalCallbackStateSerialized }>,
      callback: { (): void }
    ) => {
      callback()
    },
  })
  .addHook("onRequest", async (req, res) => {
    if (!req.cookies["user_anon_id"]) {
      res.setCookie("user_anon_id", generateUUID(), {
        domain: env.domain,
        path: "/",
        sameSite: "lax",
        httpOnly: true,
        secure: !isDev,
      })
    }
  })
  .setErrorHandler(function (error, _, reply) {
    // Log error
    this.log.error(error)

    // Send error response
    reply
      .status(error.statusCode ?? 500)
      .send({ message: error.message ?? "Internal Server Error" })
  })

//login
app.get<{ Params: { provider: AuthProvider }; Querystring: { state: string } }>(
  "/login/:provider/callback",
  async function (request, reply) {
    const { provider } = request.params
    if (!provider) throw new InvalidRequestError("Missing provider")

    const access_token = await authService.getProviderToken(app, request, provider)
    const userInfo = (await authService.loadUserInfo(provider, access_token)) as any
    if (!userInfo) throw new ServerError("Failed to load user data")

    const { userId, name, picture } = await authService.handleProviderLogin(provider, userInfo)
    if (!userId) throw new ServerError()

    reply.setCookie("user", JSON.stringify({ userId, name, picture }), {
      ...cookieSettings,
      httpOnly: false,
    })
    reply.setCookie("user_id", userId, {
      ...cookieSettings,
      httpOnly: true,
    })
    // if later you need to refresh the token you can use
    // const { token: newToken } = await this.getNewAccessTokenUsingRefreshToken(token)
    reply.setCookie("access_token", access_token, {
      ...cookieSettings,
      httpOnly: true,
    })

    let redirectTarget = "/"

    if (request.query.state) {
      const stateData = JSON.parse(request.query.state) as AuthModalCallbackStateSerialized
      const { viewcommunity, viewpost, createcommunity, createpost } = stateData
      if (viewcommunity) {
        redirectTarget += `communities/${viewcommunity}`
      } else if (createcommunity) {
        redirectTarget += "communities?createcommunity=true"
      }
      if (viewpost) {
        redirectTarget += `?post=${viewpost}`
      } else if (createpost) {
        redirectTarget += "?createpost=true"
      }
    }

    reply.redirect(redirectTarget)
  }
)
//logout
app.get("/logout", async function (_, reply) {
  reply.clearCookie("user", {
    ...cookieSettings,
    httpOnly: false,
  })
  reply.clearCookie("user_id", {
    ...cookieSettings,
    httpOnly: true,
  })
  reply.clearCookie("access_token", {
    ...cookieSettings,
    httpOnly: true,
  })
  reply.redirect("/")
})

app.get("/favicon.ico", (_, res) => {
  res.status(404).send()
})

if (isDev) await import("../../.cb/sse").then(({ configureSSE }) => configureSSE(app))

configureUserRoutes(app)
configureCommunityRoutes(app)
configurePostsRoutes(app)
configureMeRoutes(app)

app.get("/*", async (req, res) => {
  const reqUser = req.cookies["user"]
  const reqUserId = req.cookies["user_id"]

  const cinnabunInstance = new Cinnabun()
  cinnabunInstance.setServerRequestData({
    path: req.url,
    data: {
      user: reqUser ? JSON.parse(reqUser) : null,
      userId: reqUserId ?? null,
    },
  })

  res.raw.writeHead(200, {
    "Transfer-Encoding": "chunked",
    "Content-Type": "text/html",
  })

  res.raw.write("<!DOCTYPE html><html>")

  await SSR.serverBake(Document(App), {
    cinnabunInstance,
    stream: res.raw,
  })
  res.raw.end("</html>")
})

app.listen({ port: parseInt(env.port), host: "0.0.0.0" }, async (err) => {
  if (err) {
    app.log.error(err)
    process.exit(1)
  }

  log(
    "FgGreen",
    `
Server is running at ${env.url}`
  )

  if (isDev) {
    try {
      log("Dim", "  evaluating application... 🔍")
      await SSR.serverBake(Document(App), {
        cinnabunInstance: new Cinnabun(),
        stream: null,
      })
      log("Dim", "  good to go! ✅")
    } catch (error) {
      if ("message" in (error as Error)) {
        const err = error as Error
        log(
          "FgRed",
          `
Failed to evaluate application.
${err.stack}
`
        )
        process.exit(96)
      }
    }
  }
})
