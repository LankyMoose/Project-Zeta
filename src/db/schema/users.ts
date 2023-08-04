import { InferModel, relations } from "drizzle-orm"
import { pgTable, uuid, varchar, index, timestamp, boolean } from "drizzle-orm/pg-core"
import { communities, communityNsfwAgreements } from "./communities.js"
import { communityMembers } from "./communityMembers.js"
import { posts, postComments, postReactions, postCommentReactions } from "./posts.js"
import { pollVotes } from "./polls.js"

export const users = pgTable(
  "user",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("username", { length: 80 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    disabled: boolean("disabled").default(false).notNull(),
    avatarUrl: varchar("avatar_url", { length: 255 }),
    deleted: boolean("deleted").default(false),
  },
  (table) => {
    return {
      nameIdx: index("user_name_idx").on(table.name),
    }
  }
)

export const userRelations = relations(users, ({ many }) => ({
  communities: many(communityMembers),
  ownedCommunities: many(communities),
  posts: many(posts),
  comments: many(postComments),
  commentReactions: many(postCommentReactions),
  reactions: many(postReactions),
  pollVotes: many(pollVotes),
  nsfwAgreements: many(communityNsfwAgreements),
}))

export type User = InferModel<typeof users>
export type NewUser = InferModel<typeof users, "insert">

export const userAuths = pgTable(
  "user_auth",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: varchar("email", { length: 80 }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    provider: varchar("provider", { length: 80 }).notNull(),
    providerId: varchar("provider_id", { length: 80 }).notNull(),
  },
  (table) => {
    return {
      emailIdx: index("user_auth_email_idx").on(table.email),
      userIdIdx: index("user_auth_user_id_idx").on(table.userId),
      providerIdIdx: index("user_auth_provider_id_idx").on(table.providerId),
    }
  }
)

export const userAuthRelations = relations(userAuths, ({ one }) => ({
  user: one(users, {
    fields: [userAuths.userId],
    references: [users.id],
  }),
}))

export type UserAuth = InferModel<typeof userAuths>
export type NewUserAuth = InferModel<typeof userAuths, "insert">
