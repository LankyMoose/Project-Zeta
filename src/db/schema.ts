import {
  boolean,
  index,
  pgTable,
  varchar,
  uuid,
  timestamp,
} from "drizzle-orm/pg-core"
import { InferModel } from "drizzle-orm"

export const users = pgTable(
  "user",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("username", { length: 80 }).notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    disabled: boolean("disabled").default(false),
    avatarUrl: varchar("avatar_url", { length: 255 }),
  },
  (table) => {
    return {
      nameIdx: index("user_name_idx").on(table.name),
    }
  }
)

export type User = InferModel<typeof users>
export type NewUser = InferModel<typeof users, "insert">

export const userAuths = pgTable(
  "user_auth",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: varchar("email", { length: 80 }).notNull(),
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

export type UserAuth = InferModel<typeof userAuths>
export type NewUserAuth = InferModel<typeof userAuths, "insert">

// export const userRoles = pgTable(
//   "user_role",
//   {
//     id: uuid("id").primaryKey().defaultRandom(),
//     userId: uuid("user_id")
//       .notNull()
//       .references(() => users.id),
//     role: varchar("role", { length: 80 }).notNull(),
//   },
//   (table) => {
//     return {
//       userIdIdx: index("user_role_user_id_idx").on(table.userId),
//     }
//   }
// )

// export type UserRole = InferModel<typeof userRoles>
// export type NewUserRole = InferModel<typeof userRoles, "insert">

export const polls = pgTable(
  "poll",
  {
    id: uuid("id").primaryKey().defaultRandom().notNull(),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => users.id),
    desc: varchar("desc", { length: 255 }).notNull(),
    startedAt: timestamp("started_at").defaultNow().notNull(),
    endedAt: timestamp("ended_at"),
    disabled: boolean("disabled").default(false),
  },
  (table) => {
    return {
      ownerIdIdx: index("poll_owner_id_idx").on(table.ownerId),
      startedAtIdx: index("poll_started_at_idx").on(table.startedAt),
    }
  }
)

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

export type PollVote = InferModel<typeof pollVotes>
export type NewPollVote = InferModel<typeof pollVotes, "insert">
