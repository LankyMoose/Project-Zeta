import { boolean, index, pgTable, varchar, uuid, timestamp, pgEnum } from "drizzle-orm/pg-core"
import { InferModel, relations } from "drizzle-orm"

export const users = pgTable(
  "user",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("username", { length: 80 }).notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    disabled: boolean("disabled").default(false),
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
  reactions: many(postReactions),
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

export const communities = pgTable(
  "community",
  {
    id: uuid("id").primaryKey().defaultRandom().notNull(),
    title: varchar("title", { length: 128 }).notNull(),
    url_title: varchar("url_title", { length: 128 }),
    description: varchar("description", { length: 255 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    disabled: boolean("disabled").default(false),
    private: boolean("private").default(false),
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
}))

export type Community = InferModel<typeof communities>
export type NewCommunity = InferModel<typeof communities, "insert">

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

export const posts = pgTable(
  "post",
  {
    id: uuid("id").primaryKey().defaultRandom().notNull(),
    communityId: uuid("community_id")
      .notNull()
      .references(() => communities.id, {
        onDelete: "cascade",
      }),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => users.id),
    title: varchar("title", { length: 128 }).notNull(),
    content: varchar("content", { length: 2048 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    disabled: boolean("disabled").default(false),
    deleted: boolean("deleted").default(false),
  },
  (table) => {
    return {
      communityIdIdx: index("post_community_id_idx").on(table.communityId),
      ownerIdIdx: index("post_owner_id_idx").on(table.ownerId),
      createdAtIdx: index("post_created_at_idx").on(table.createdAt),
    }
  }
)

export const postRelations = relations(posts, ({ one, many }) => ({
  community: one(communities, {
    fields: [posts.communityId],
    references: [communities.id],
  }),
  user: one(users, {
    fields: [posts.ownerId],
    references: [users.id],
  }),
  comments: many(postComments),
  reactions: many(postReactions),
}))

export type Post = InferModel<typeof posts>
export type NewPost = InferModel<typeof posts, "insert">

// threadPost comments

export const postComments = pgTable(
  "post_comment",
  {
    id: uuid("id").primaryKey().defaultRandom().notNull(),
    postId: uuid("post_id")
      .notNull()
      .references(() => posts.id, {
        onDelete: "cascade",
      }),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => users.id),
    content: varchar("content", { length: 255 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    deleted: boolean("deleted").default(false),
  },
  (table) => {
    return {
      postIdIdx: index("post_comment_post_id_idx").on(table.postId),
      ownerIdIdx: index("post_comment_owner_id_idx").on(table.ownerId),
      createdAtIdx: index("post_comment_created_at_idx").on(table.createdAt),
    }
  }
)

export const postCommentsRelations = relations(postComments, ({ one }) => ({
  post: one(posts, {
    fields: [postComments.postId],
    references: [posts.id],
  }),
  user: one(users, {
    fields: [postComments.ownerId],
    references: [users.id],
  }),
}))

export type PostComment = InferModel<typeof postComments>
export type NewPostComment = InferModel<typeof postComments, "insert">

// threadPost reactions

export const postReactions = pgTable(
  "post_reaction",
  {
    id: uuid("id").primaryKey().defaultRandom().notNull(),
    postId: uuid("post_id")
      .notNull()
      .references(() => posts.id, {
        onDelete: "cascade",
      }),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => users.id),
    reaction: boolean("reaction").notNull(),
  },
  (table) => {
    return {
      postIdIdx: index("post_reaction_post_id_idx").on(table.postId),
      ownerIdIdx: index("post_reaction_owner_id_idx").on(table.ownerId),
    }
  }
)

export const postReactionsRelations = relations(postReactions, ({ one }) => ({
  post: one(posts, {
    fields: [postReactions.postId],
    references: [posts.id],
  }),
  user: one(users, {
    fields: [postReactions.ownerId],
    references: [users.id],
  }),
}))

export type PostReaction = InferModel<typeof postReactions>
export type NewPostReaction = InferModel<typeof postReactions, "insert">

export const postContentTypeEnum = pgEnum("post_content_type", ["poll", "image", "video"])

export const postContent = pgTable(
  "post_content",
  {
    id: uuid("id").primaryKey().defaultRandom().notNull(),
    postId: uuid("post_id")
      .notNull()
      .references(() => posts.id, {
        onDelete: "cascade",
      }),
    type: postContentTypeEnum("type").notNull(),
  },
  (table) => {
    return {
      postIdIdx: index("post_content_post_id_idx").on(table.postId),
    }
  }
)

export const postContentRelations = relations(postContent, ({ one }) => ({
  post: one(posts, {
    fields: [postContent.postId],
    references: [posts.id],
  }),
}))

export const polls = pgTable(
  "poll",
  {
    id: uuid("id").primaryKey().defaultRandom().notNull(),
    postId: uuid("post_id")
      .notNull()
      .references(() => posts.id),
    desc: varchar("desc", { length: 255 }).notNull(),
    startedAt: timestamp("started_at").defaultNow().notNull(),
    endedAt: timestamp("ended_at"),
    disabled: boolean("disabled").default(false),
  },
  (table) => {
    return {
      ownerIdIdx: index("poll_post_id_idx").on(table.postId),
      startedAtIdx: index("poll_started_at_idx").on(table.startedAt),
    }
  }
)

export const pollRelations = relations(polls, ({ one, many }) => ({
  postContent: one(postContent, {
    fields: [polls.postId],
    references: [postContent.id],
  }),
  options: many(pollOptions),
  votes: many(pollVotes),
}))

export type Poll = InferModel<typeof polls>
export type NewPoll = InferModel<typeof polls, "insert">

export const pollOptions = pgTable(
  "poll_option",
  {
    id: uuid("id").primaryKey().defaultRandom().notNull(),
    pollId: uuid("poll_id")
      .notNull()
      .references(() => polls.id, {
        onDelete: "cascade",
      }),
    desc: varchar("desc", { length: 32 }).notNull(),
  },
  (table) => {
    return {
      pollIdIdx: index("poll_option_poll_id_idx").on(table.pollId),
    }
  }
)

export const pollOptionRelations = relations(pollOptions, ({ one }) => ({
  poll: one(polls, {
    fields: [pollOptions.pollId],
    references: [polls.id],
  }),
}))

export type PollOption = InferModel<typeof pollOptions>
export type NewPollOption = InferModel<typeof pollOptions, "insert">

export const pollVotes = pgTable(
  "poll_vote",
  {
    id: uuid("id").primaryKey().defaultRandom().notNull(),
    pollId: uuid("poll_id")
      .notNull()
      .references(() => polls.id, {
        onDelete: "cascade",
      }),
    optionId: uuid("option_id")
      .notNull()
      .references(() => pollOptions.id, {
        onDelete: "cascade",
      }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
  },
  (table) => {
    return {
      pollIdIdx: index("poll_vote_poll_id_idx").on(table.pollId),
      optionIdIdx: index("poll_vote_option_id_idx").on(table.optionId),
      userIdIdx: index("poll_vote_user_id_idx").on(table.userId),
    }
  }
)

export const pollVoteRelations = relations(pollVotes, ({ one }) => ({
  poll: one(polls, {
    fields: [pollVotes.pollId],
    references: [polls.id],
  }),
  option: one(pollOptions, {
    fields: [pollVotes.optionId],
    references: [pollOptions.id],
  }),
  user: one(users, {
    fields: [pollVotes.userId],
    references: [users.id],
  }),
}))

export type PollVote = InferModel<typeof pollVotes>
export type NewPollVote = InferModel<typeof pollVotes, "insert">
