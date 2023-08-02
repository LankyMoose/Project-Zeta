import { and, eq } from "drizzle-orm"
import { db } from "../../db"
import { NewUserAuth, UserAuth, userAuths } from "../../db/schema"
import { AuthProvider } from "../../types/auth"
import { ServerError } from "../../errors"
import { userService } from "./userService"
import { FastifyInstance, FastifyRequest } from "fastify"

export const authService = {
  async getByEmail(email: string): Promise<UserAuth | undefined> {
    return (await db.select().from(userAuths).where(eq(userAuths.email, email)).limit(1)).at(0)
  },

  async getByProviderId(provider: AuthProvider, providerId: string): Promise<UserAuth | undefined> {
    return (
      await db
        .select()
        .from(userAuths)
        .where(and(eq(userAuths.provider, provider), eq(userAuths.providerId, providerId)))
        .limit(1)
    ).at(0)
  },

  async save(userAuth: UserAuth | NewUserAuth): Promise<UserAuth | undefined> {
    if (!userAuth.id) {
      return (await db.insert(userAuths).values(userAuth).returning()).at(0)
    }
    return (
      await db.update(userAuths).set(userAuth).where(eq(userAuths.id, userAuth.id)).returning()
    ).at(0)
  },

  async handleProviderLogin(
    provider: AuthProvider,
    info: any
  ): Promise<{
    userId: string
    name: string
    picture: string
  }> {
    const userAuth = await authService.getByProviderId(provider, info.id)
    switch (provider) {
      case AuthProvider.Google: {
        const { name, picture, id, email } = info
        const userId = await this.saveUserAuth(provider, userAuth, name, picture, id, email)
        return { userId, name, picture }
      }
      case AuthProvider.Github: {
        const { login, avatar_url, id, email } = info
        const userId = await this.saveUserAuth(provider, userAuth, login, avatar_url, id, email)
        return { userId, name: login, picture: avatar_url }
      }
      default:
        throw new ServerError("Invalid provider")
    }
  },

  async saveUserAuth(
    provider: AuthProvider,
    auth: UserAuth | undefined,
    name: string,
    picture: string,
    id: string,
    email: string
  ) {
    const user = await userService.save({
      id: auth?.userId,
      name,
      avatarUrl: picture,
    })

    if (!user) throw new ServerError()
    if (!auth) {
      const res = await this.save({
        email,
        provider,
        providerId: id,
        userId: user.id,
      })
      if (!res) throw new ServerError()
    }
    return user.id
  },

  async getProviderToken(app: FastifyInstance, req: FastifyRequest, provider: AuthProvider) {
    switch (provider) {
      case AuthProvider.Google: {
        const res = await app.googleOAuth2.getAccessTokenFromAuthorizationCodeFlow(req)
        return res.token.access_token
      }
      case AuthProvider.Github: {
        const res = await app.githubOAuth2.getAccessTokenFromAuthorizationCodeFlow(req)
        return res.token.access_token
      }
      default:
        throw new ServerError("Invalid provider")
    }
  },

  async loadUserInfo(provider: AuthProvider, reqOrToken: FastifyRequest | string) {
    const tkn = typeof reqOrToken === "string" ? reqOrToken : reqOrToken.cookies["access_token"]

    if (!tkn) return null

    switch (provider) {
      case AuthProvider.Google: {
        const userDataRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
          method: "GET",
          headers: {
            Authorization: "Bearer " + tkn,
          },
        })
        if (!userDataRes.ok) throw new ServerError("Failed to load user data")
        return userDataRes.json()
      }
      case AuthProvider.Github: {
        const userDataRes = await fetch("https://api.github.com/user", {
          method: "GET",
          headers: {
            Authorization: "Bearer " + tkn,
          },
        })
        if (!userDataRes.ok) throw new ServerError("Failed to load user data")
        return userDataRes.json()
      }
      default:
        throw new ServerError("Invalid provider")
    }
  },
}
