import path from "path"
import { fileURLToPath } from "url"
import fetch from "node-fetch"

import fastify from "fastify"
import cookie from "@fastify/cookie"
import compress from "@fastify/compress"
import fStatic from "@fastify/static"
import websocket from "@fastify/websocket"

import { OAuth2Namespace } from "@fastify/oauth2"

import { SSR } from "cinnabun/ssr"
import { Cinnabun } from "cinnabun"
import { log } from "../../.cb/logger.js"

import { Document } from "../app/Document.jsx"
import { App } from "../app/App.jsx"

import { env } from "../env.js"
import { socketHandler } from "./socket.js"
import { generateUUID } from "../utils.js"

import { configureCommunityRoutes } from "./api/communities.js"
import { configurePostsRoutes } from "./api/posts.js"
import { configureUserRoutes } from "./api/users.js"
import { configureMeRoutes } from "./api/me.js"
import { configureAuthRoutes } from "./api/auth.js"

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

app.get("/favicon.ico", (_, res) => {
  res.status(404).send()
})

app.get("/test", (_, res) => {
  res.status(200).send("Hello World!")
})

if (isDev) await import("../../.cb/sse").then(({ configureSSE }) => configureSSE(app))

configureAuthRoutes(app)
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
