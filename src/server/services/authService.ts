import { eq } from "drizzle-orm"
import { db } from "../../db"
import { UserAuth, userAuths } from "../../db/schema"

export const authService = {
  async getByEmail(email: string): Promise<UserAuth | undefined> {
    return (
      await db
        .select()
        .from(userAuths)
        .where(eq(userAuths.email, email))
        .limit(1)
    ).at(0)
  },

  async getByProviderId(providerId: string): Promise<UserAuth | undefined> {
    return (
      await db
        .select()
        .from(userAuths)
        .where(eq(userAuths.providerId, providerId))
        .limit(1)
    ).at(0)
  },

  async save(userAuth: UserAuth): Promise<UserAuth> {
    if (!userAuth.id) {
      return (await db.insert(userAuths).values(userAuth).returning()).at(
        0
      ) as UserAuth
    }
    return (
      await db
        .update(userAuths)
        .set(userAuth)
        .where(eq(userAuths.id, userAuth.id))
        .returning()
    ).at(0) as UserAuth
  },
}
