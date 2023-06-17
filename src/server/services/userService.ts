import { and, eq } from "drizzle-orm"
import { db } from "../../db"
import { NewUser, User, users } from "../../db/schema"

export const userService = {
  pageSize: 100,
  async getPage(page: number = 0): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(eq(users.disabled, false))
      .limit(this.pageSize)
      .offset(page * this.pageSize)
  },
  async getById(id: number) {
    return (
      await db
        .select()
        .from(users)
        .where(and(eq(users.id, id), eq(users.disabled, false)))
        .limit(1)
    ).at(0)
  },
  async save(user: NewUser): Promise<User> {
    if (user.id === 0 || !user.id) {
      return (await db.insert(users).values(user).returning()).at(0) as User
    }
    return (
      await db.update(users).set(user).where(eq(users.id, user.id)).returning()
    ).at(0) as User
  },
}
