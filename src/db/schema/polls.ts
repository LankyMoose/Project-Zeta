import { relations, InferModel } from "drizzle-orm"
import { pgTable, uuid, varchar, timestamp, boolean, index } from "drizzle-orm/pg-core"
import { posts } from "./posts.js"
import { users } from "./users.js"

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
  poll: one(posts, {
    fields: [polls.postId],
    references: [posts.id],
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
