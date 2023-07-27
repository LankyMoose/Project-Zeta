import { and, eq } from "drizzle-orm";
import { db } from "../../db";
import { userAuths } from "../../db/schema";
export const authService = {
    async getByEmail(email) {
        return (await db.select().from(userAuths).where(eq(userAuths.email, email)).limit(1)).at(0);
    },
    async getByProviderId(provider, providerId) {
        return (await db
            .select()
            .from(userAuths)
            .where(and(eq(userAuths.provider, provider), eq(userAuths.providerId, providerId)))
            .limit(1)).at(0);
    },
    async save(userAuth) {
        if (!userAuth.id) {
            return (await db.insert(userAuths).values(userAuth).returning()).at(0);
        }
        return (await db.update(userAuths).set(userAuth).where(eq(userAuths.id, userAuth.id)).returning()).at(0);
    },
};
