import { FastifyInstance, FastifyRequest } from "fastify"
import oauthPlugin from "@fastify/oauth2"
import { AuthModalCallbackStateSerialized, AuthProvider } from "../../types/auth"
import { authService } from "../services/authService"
import { cookieSettings } from "../cookies"
import { env } from "../../env"
import { getOrDie, valueOrDie } from "./util"
import { userService } from "../services/userService"

export function configureAuthRoutes(app: FastifyInstance) {
  app
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

  app.get<{ Params: { provider: AuthProvider }; Querystring: { state: string } }>(
    "/login/:provider/callback",
    async function (request, reply) {
      const { provider } = valueOrDie(request.params, "Missing provider")

      const access_token = await getOrDie(
        authService.getProviderToken(app, request, provider),
        "Failed to get user access token"
      )
      const providerData = await getOrDie(
        authService.loadProviderData(provider, access_token),
        "Failed to load user provider data"
      )
      const { providerId, name, picture, email } = authService.normalizeProviderData(
        provider,
        providerData
      )

      const userAuth = await authService.getByProviderId(provider, providerId)

      const user = await getOrDie(
        userAuth?.userId
          ? userService.getById(userAuth.userId)
          : userService.upsert({
              name,
              avatarUrl: picture,
            })
      )

      if (!userAuth) {
        await getOrDie(
          authService.upsert({
            email,
            provider,
            providerId,
            userId: user.userId,
          })
        )
      }

      reply.setCookie("user", JSON.stringify(user), {
        ...cookieSettings,
        httpOnly: false,
      })
      reply.setCookie("user_id", user.userId, {
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
}
