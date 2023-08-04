import { pgTable, uuid, varchar, timestamp, boolean, index } from "drizzle-orm/pg-core"
import { InferModel, relations } from "drizzle-orm"
import { users } from "./users.js"
import { communityMembers, communityJoinRequests } from "./communityMembers.js"
import { posts } from "./posts.js"

export const communities = pgTable(
  "community",
  {
    id: uuid("id").primaryKey().defaultRandom().notNull(),
    title: varchar("title", { length: 128 }).notNull(),
    url_title: varchar("url_title", { length: 128 }).default("").notNull(),
    description: varchar("description", { length: 255 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    disabled: boolean("disabled").default(false),
    deleted: boolean("deleted").default(false),
    private: boolean("private").default(false),
    nsfw: boolean("nsfw").default(false),
  },
  (table) => {
    return {
      createdAtIdx: index("community_created_at_idx").on(table.createdAt),
      titleIdx: index("community_title_idx").on(table.title),
      url_titleIdx: index("community_url_title_idx").on(table.title),
    }
  }
)

export const communityRelations = relations(communities, ({ many }) => ({
  posts: many(posts),
  members: many(communityMembers),
  moderators: many(communityMembers),
  owners: many(communityMembers),
  joinRequests: many(communityJoinRequests),
  nsfwAgreements: many(communityNsfwAgreements),
}))

export type Community = InferModel<typeof communities>
export type NewCommunity = InferModel<typeof communities, "insert">

export const communityNsfwAgreements = pgTable(
  "community_nsfw_agreement",
  {
    id: uuid("id").primaryKey().defaultRandom().notNull(),
    communityId: uuid("community_id")
      .notNull()
      .references(() => communities.id, {
        onDelete: "cascade",
      }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    agreedAt: timestamp("agreed_at").defaultNow().notNull(),
  },
  (table) => {
    return {
      communityIdIdx: index("community_nsfw_agreement_community_id_idx").on(table.communityId),
      userIdIdx: index("community_nsfw_agreement_user_id_idx").on(table.userId),
    }
  }
)

export const communityNsfwAgreementRelations = relations(communityNsfwAgreements, ({ one }) => ({
  user: one(users, {
    fields: [communityNsfwAgreements.userId],
    references: [users.id],
  }),
  community: one(communities, {
    fields: [communityNsfwAgreements.communityId],
    references: [communities.id],
  }),
}))

export type CommunityNsfwAgreement = InferModel<typeof communityNsfwAgreements>
export type NewCommunityNsfwAgreement = InferModel<typeof communityNsfwAgreements, "insert">
