import {
  boolean,
  date,
  index,
  integer,
  pgTable,
  serial,
  varchar,
  uuid,
} from "drizzle-orm/pg-core"
import { InferModel } from "drizzle-orm"

export const users = pgTable(
  "user",
  {
    id: serial("id").primaryKey(),
    webId: uuid("web_id").defaultRandom(),
    name: varchar("username", { length: 80 }).notNull(),
    createdAt: date("created_at").defaultNow(),
    disabled: boolean("disabled").default(false),
    avatarUrl: varchar("avatar_url", { length: 255 }),
  },
  (table) => {
    return {
      nameIdx: index("name_idx").on(table.name),
      webIdIdx: index("web_id_idx").on(table.webId),
    }
  }
)

export type User = InferModel<typeof users>
export type NewUser = InferModel<typeof users, "insert">

export const userAuths = pgTable(
  "user_auth",
  {
    id: serial("id").primaryKey(),
    email: varchar("email", { length: 80 }).notNull(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id),
    provider: varchar("provider", { length: 80 }).notNull(),
    providerId: varchar("provider_id", { length: 80 }).notNull(),
  },
  (table) => {
    return {
      emailIdx: index("email_idx").on(table.email),
      userIdIdx: index("user_id_idx").on(table.userId),
      providerIdIdx: index("provider_id_idx").on(table.providerId),
    }
  }
)

export type UserAuth = InferModel<typeof userAuths>
export type NewUserAuth = InferModel<typeof userAuths, "insert">

export const polls = pgTable(
  "poll",
  {
    id: serial("id").primaryKey(),
    ownerId: integer("owner_id")
      .notNull()
      .references(() => users.id),
    desc: varchar("desc", { length: 255 }).notNull(),
    startedAt: date("started_at").defaultNow().notNull(),
    endedAt: date("ended_at"),
    disabled: boolean("disabled").default(false),
  },
  (table) => {
    return {
      ownerIdIdx: index("owner_id_idx").on(table.ownerId),
      startedAtIdx: index("started_at_idx").on(table.startedAt),
    }
  }
)

export type Poll = InferModel<typeof polls>
export type NewPoll = InferModel<typeof polls, "insert">

export const pollOptions = pgTable(
  "poll_option",
  {
    id: serial("id").primaryKey(),
    pollId: integer("poll_id")
      .notNull()
      .references(() => polls.id),
    desc: varchar("desc", { length: 255 }).notNull(),
  },
  (table) => {
    return {
      pollIdIdx: index("poll_id_idx").on(table.pollId),
    }
  }
)

export type PollOption = InferModel<typeof pollOptions>
export type NewPollOption = InferModel<typeof pollOptions, "insert">

export const pollVotes = pgTable(
  "poll_vote",
  {
    id: serial("id").primaryKey(),
    pollId: integer("poll_id")
      .notNull()
      .references(() => polls.id),
    optionId: integer("option_id")
      .notNull()
      .references(() => pollOptions.id),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id),
  },
  (table) => {
    return {
      pollIdIdx: index("poll_id_idx").on(table.pollId),
      optionIdIdx: index("option_id_idx").on(table.optionId),
      userIdIdx: index("user_id_idx").on(table.userId),
    }
  }
)

export type PollVote = InferModel<typeof pollVotes>
export type NewPollVote = InferModel<typeof pollVotes, "insert">
