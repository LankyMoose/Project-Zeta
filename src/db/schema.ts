import { boolean, date, index, integer, pgTable, serial, varchar } from "drizzle-orm/pg-core"
import { InferModel } from "drizzle-orm"

export const users = pgTable("user", {
  id: serial("id").primaryKey(),
  name: varchar("username", { length: 80 }).notNull(),
  createdAt: date("created_at").defaultNow(),
  disabled: boolean("disabled").default(false),
})

export type User = InferModel<typeof users>
export type NewUser = InferModel<typeof users, "insert">

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
