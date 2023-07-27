import { and, eq } from "drizzle-orm";
import { db } from "../../db";
import { users } from "../../db/schema";
export const userService = {
    pageSize: 100,
    async getPage(page = 0) {
        try {
            return await db
                .select()
                .from(users)
                .where(and(eq(users.disabled, false), eq(users.deleted, false)))
                .limit(this.pageSize)
                .offset(page * this.pageSize);
        }
        catch (error) {
            console.error(error);
            return;
        }
    },
    async getById(id) {
        try {
            return (await db
                .select()
                .from(users)
                .where(and(eq(users.id, id), eq(users.disabled, false), eq(users.deleted, false)))
                .limit(1)).at(0);
        }
        catch (error) {
            console.error(error);
            return;
        }
    },
    async save(user) {
        try {
            if (!user.id) {
                return (await db.insert(users).values(user).returning()).at(0);
            }
            return (await db
                .update(users)
                .set(user)
                .where(and(eq(users.id, user.id), eq(users.disabled, false), eq(users.deleted, false)))
                .returning()).at(0);
        }
        catch (error) {
            console.error(error);
            return;
        }
    },
};
