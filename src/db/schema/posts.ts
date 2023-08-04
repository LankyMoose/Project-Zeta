import { relations, InferModel } from "drizzle-orm"
import { pgTable, uuid, varchar, timestamp, boolean, index } from "drizzle-orm/pg-core"
import { communities } from "./communities.js"
import { users } from "./users.js"
import { polls } from "./polls.js"
import { postMultimedia } from "./multimedia.js"

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
  poll: one(polls, {
    fields: [posts.id],
    references: [polls.postId],
  }),
  multimedia: many(postMultimedia),
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

export const postCommentsRelations = relations(postComments, ({ one, many }) => ({
  post: one(posts, {
    fields: [postComments.postId],
    references: [posts.id],
  }),
  user: one(users, {
    fields: [postComments.ownerId],
    references: [users.id],
  }),
  reactions: many(postCommentReactions),
  replies: many(postCommentReplies),
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

export const postCommentReactions = pgTable(
  "post_comment_reaction",
  {
    id: uuid("id").primaryKey().defaultRandom().notNull(),
    commentId: uuid("comment_id")
      .notNull()
      .references(() => postComments.id, {
        onDelete: "cascade",
      }),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => users.id),
    reaction: boolean("reaction").notNull(),
  },
  (table) => {
    return {
      commentIdIdx: index("post_comment_reaction_comment_id_idx").on(table.commentId),
      ownerIdIdx: index("post_comment_reaction_owner_id_idx").on(table.ownerId),
    }
  }
)

export const postCommentReactionRelations = relations(postCommentReactions, ({ one }) => ({
  comment: one(postComments, {
    fields: [postCommentReactions.commentId],
    references: [postComments.id],
  }),
  user: one(users, {
    fields: [postCommentReactions.ownerId],
    references: [users.id],
  }),
}))

export type PostCommentReaction = InferModel<typeof postCommentReactions>
export type NewPostCommentReaction = InferModel<typeof postCommentReactions, "insert">

export const postCommentReplies = pgTable(
  "post_comment_reply",
  {
    id: uuid("id").primaryKey().defaultRandom().notNull(),
    commentId: uuid("comment_id")
      .notNull()
      .references(() => postComments.id, {
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
      commentIdIdx: index("post_comment_reply_comment_id_idx").on(table.commentId),
      ownerIdIdx: index("post_comment_reply_owner_id_idx").on(table.ownerId),
      createdAtIdx: index("post_comment_reply_created_at_idx").on(table.createdAt),
    }
  }
)

export const postCommentReplyRelations = relations(postCommentReplies, ({ one, many }) => ({
  comment: one(postComments, {
    fields: [postCommentReplies.commentId],
    references: [postComments.id],
  }),
  user: one(users, {
    fields: [postCommentReplies.ownerId],
    references: [users.id],
  }),
  reactions: many(postCommentReplyReactions),
}))

export type PostCommentReply = InferModel<typeof postCommentReplies>
export type NewPostCommentReply = InferModel<typeof postCommentReplies, "insert">

export const postCommentReplyReactions = pgTable(
  "post_comment_reply_reaction",
  {
    id: uuid("id").primaryKey().defaultRandom().notNull(),
    replyId: uuid("reply_id")
      .notNull()
      .references(() => postCommentReplies.id, {
        onDelete: "cascade",
      }),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => users.id),
    reaction: boolean("reaction").notNull(),
  },
  (table) => {
    return {
      replyIdIdx: index("post_comment_reply_reaction_reply_id_idx").on(table.replyId),
      ownerIdIdx: index("post_comment_reply_reaction_owner_id_idx").on(table.ownerId),
    }
  }
)

export const postCommentReplyReactionRelations = relations(
  postCommentReplyReactions,
  ({ one }) => ({
    reply: one(postCommentReplies, {
      fields: [postCommentReplyReactions.replyId],
      references: [postCommentReplies.id],
    }),
    user: one(users, {
      fields: [postCommentReplyReactions.ownerId],
      references: [users.id],
    }),
  })
)

export type PostCommentReplyReaction = InferModel<typeof postCommentReplyReactions>
export type NewPostCommentReplyReaction = InferModel<typeof postCommentReplyReactions, "insert">
