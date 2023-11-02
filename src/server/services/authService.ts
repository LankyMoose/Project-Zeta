import { and, eq } from "drizzle-orm"
import { db } from "../../db"
import { NewUserAuth, UserAuth, userAuths } from "../../db/schema"
import { AuthProvider } from "../../types/auth"
import { FastifyInstance, FastifyRequest } from "fastify"
import { match } from "matcha-js"

type ProviderInfo<T extends AuthProvider> = T extends AuthProvider.Google
  ? {
      name: string
      picture: string
      id: string
      email: string
    }
  : T extends AuthProvider.Github
  ? {
      login: string
      avatar_url: string
      id: string
      email: string
    }
  : never

export const authService = {
  async getByEmail(email: string): Promise<UserAuth | undefined> {
    try {
      return (await db.select().from(userAuths).where(eq(userAuths.email, email)).limit(1)).at(0)
    } catch (error) {
      console.error(error)
      return
    }
  },

  async getByProviderId(provider: AuthProvider, providerId: string): Promise<UserAuth | undefined> {
    try {
      return (
        await db
          .select()
          .from(userAuths)
          .where(and(eq(userAuths.provider, provider), eq(userAuths.providerId, providerId)))
          .limit(1)
      ).at(0)
    } catch (error) {
      console.error(error)
      return
    }
  },

  async upsert(userAuth: UserAuth | NewUserAuth): Promise<UserAuth | undefined> {
    try {
      if (!userAuth.id) {
        return (await db.insert(userAuths).values(userAuth).returning()).at(0)
      }
      return (
        await db.update(userAuths).set(userAuth).where(eq(userAuths.id, userAuth.id)).returning()
      ).at(0)
    } catch (error) {
      console.error(error)
      return
    }
  },

  normalizeProviderData(provider: AuthProvider, info: ProviderInfo<AuthProvider>) {
    switch (provider) {
      case AuthProvider.Google: {
        const { name, picture, id, email } = info as ProviderInfo<AuthProvider.Google>
        return { name, picture, providerId: id, email }
      }
      case AuthProvider.Github: {
        const { login, avatar_url, id, email } = info as ProviderInfo<AuthProvider.Github>
        return { name: login, picture: avatar_url, providerId: id, email }
      }
    }
  },

  async getProviderToken(provider: AuthProvider, app: FastifyInstance, req: FastifyRequest) {
    try {
      return (
        await match(provider)(
          [AuthProvider.Google, () => app.googleOAuth2],
          [AuthProvider.Github, () => app.githubOAuth2]
        ).getAccessTokenFromAuthorizationCodeFlow(req)
      ).token.access_token
    } catch (error) {
      console.error(error)
      return
    }
  },

  async loadProviderData<T extends AuthProvider>(
    provider: T,
    reqOrToken: FastifyRequest | string
  ): Promise<ProviderInfo<T> | undefined> {
    try {
      const tkn = typeof reqOrToken === "string" ? reqOrToken : reqOrToken.cookies["access_token"]
      if (!tkn) return

      const url = match(provider)(
        [AuthProvider.Google, () => "https://www.googleapis.com/oauth2/v2/userinfo"],
        [AuthProvider.Github, () => "https://api.github.com/user"]
      )

      const res = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: "Bearer " + tkn,
        },
      })
      if (!res.ok) return

      return res.json() as Promise<ProviderInfo<T>>
    } catch (error) {
      console.error(error)
      return
    }
  },
}
