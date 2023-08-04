import { relations, InferModel } from "drizzle-orm"
import { pgEnum, pgTable, uuid, timestamp, boolean, index } from "drizzle-orm/pg-core"
import { communities } from "./communities.js"
import { users } from "./users.js"

export const communityMemberTypeEnum = pgEnum("community_member_type", [
  "member",
  "moderator",
  "owner",
])

export const communityMembers = pgTable(
  "community_member",
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
    createdAt: timestamp("created_at").defaultNow().notNull(),
    disabled: boolean("disabled").default(false),
    memberType: communityMemberTypeEnum("member_types").notNull().default("member"),
  },
  (table) => {
    return {
      communityIdIdx: index("community_member_community_id_idx").on(table.communityId),
      userIdIdx: index("community_member_user_id_idx").on(table.userId),
    }
  }
)

export const communityMemberRelations = relations(communityMembers, ({ one }) => ({
  user: one(users, {
    fields: [communityMembers.userId],
    references: [users.id],
  }),
  community: one(communities, {
    fields: [communityMembers.communityId],
    references: [communities.id],
  }),
}))

export type CommunityMember = InferModel<typeof communityMembers>
export type NewCommunityMember = InferModel<typeof communityMembers, "insert">

export const communityJoinRequests = pgTable(
  "community_join_request",
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
    createdAt: timestamp("created_at").defaultNow().notNull(),
    response: boolean("response"),
    respondedAt: timestamp("responded_at"),
    respondedBy: uuid("responded_by"),
  },
  (table) => {
    return {
      communityIdIdx: index("community_join_request_community_id_idx").on(table.communityId),
      userIdIdx: index("community_join_request_user_id_idx").on(table.userId),
      respondedByIdx: index("community_join_request_responded_by_idx").on(table.respondedBy),
    }
  }
)

export const communityJoinRequestRelations = relations(communityJoinRequests, ({ one }) => ({
  user: one(users, {
    fields: [communityJoinRequests.userId],
    references: [users.id],
  }),
  community: one(communities, {
    fields: [communityJoinRequests.communityId],
    references: [communities.id],
  }),
  respondedBy: one(users, {
    fields: [communityJoinRequests.respondedBy],
    references: [users.id],
  }),
}))

export type CommunityJoinRequest = InferModel<typeof communityJoinRequests>
export type NewCommunityJoinRequest = InferModel<typeof communityJoinRequests, "insert">
