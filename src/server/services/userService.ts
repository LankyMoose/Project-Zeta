import { and, eq } from "drizzle-orm"
import { db } from "../../db"
import { NewUser, User, users } from "../../db/schema"
import { PublicUser } from "../../types/user"

export const userService = {
  pageSize: 100,
  async getPage(page: number = 0): Promise<User[] | undefined> {
    try {
      return await db
        .select()
        .from(users)
        .where(and(eq(users.disabled, false), eq(users.deleted, false)))
        .limit(this.pageSize)
        .offset(page * this.pageSize)
    } catch (error) {
      console.error(error)
      return
    }
  },
  async getById(id: string): Promise<PublicUser | undefined> {
    try {
      return (
        await db
          .select({
            userId: users.id,
            name: users.name,
            picture: users.avatarUrl,
          })
          .from(users)
          .where(and(eq(users.id, id), eq(users.disabled, false), eq(users.deleted, false)))
          .limit(1)
      ).at(0)
    } catch (error) {
      console.error(error)
      return
    }
  },
  async save(user: NewUser): Promise<User | undefined> {
    try {
      if (!user.id) {
        return (await db.insert(users).values(user).returning()).at(0)
      }
      return (
        await db
          .update(users)
          .set(user)
          .where(and(eq(users.id, user.id), eq(users.disabled, false), eq(users.deleted, false)))
          .returning()
      ).at(0)
    } catch (error) {
      console.error(error)
      return
    }
  },
}
