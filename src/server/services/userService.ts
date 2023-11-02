import { and, eq } from "drizzle-orm"
import { db } from "../../db"
import { NewUser, User, users } from "../../db/schema"
import { PublicUser } from "../../types/user"
import { s3Service } from "./s3Service"

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
  async upsert(user: NewUser | Omit<NewUser, "name">): Promise<PublicUser | undefined> {
    try {
      if (!user.id) {
        if (!("name" in user)) return
        return (
          await db.insert(users).values(user).returning({
            userId: users.id,
            name: users.name,
            picture: users.avatarUrl,
          })
        ).at(0)
      }
      return (
        await db
          .update(users)
          .set(user)
          .where(and(eq(users.id, user.id), eq(users.disabled, false), eq(users.deleted, false)))
          .returning({
            userId: users.id,
            name: users.name,
            picture: users.avatarUrl,
          })
      ).at(0)
    } catch (error) {
      console.error(error)
      return
    }
  },
  async getUserDisplayPictureUpdateUrl(userId: string): Promise<string | void> {
    try {
      return await s3Service.getPresignedPutUrl(`user/${userId}/avatar`)
    } catch (error) {
      console.error(error)
    }
  },
}
