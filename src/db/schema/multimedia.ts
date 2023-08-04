import { relations, InferModel } from "drizzle-orm"
import { pgTable, uuid, varchar, timestamp, boolean, index } from "drizzle-orm/pg-core"
import { posts } from "./posts.js"

export const postMultimedia = pgTable(
  "post_multimedia",
  {
    id: uuid("id").primaryKey().defaultRandom().notNull(),
    postId: uuid("post_id")
      .notNull()
      .references(() => posts.id, {
        onDelete: "cascade",
      }),
    url: varchar("url", { length: 255 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    deleted: boolean("deleted").default(false),
  },
  (table) => {
    return {
      postIdIdx: index("post_multimedia_post_id_idx").on(table.postId),
      createdAtIdx: index("post_multimedia_created_at_idx").on(table.createdAt),
    }
  }
)

export const postMultimediaRelations = relations(postMultimedia, ({ one }) => ({
  post: one(posts, {
    fields: [postMultimedia.postId],
    references: [posts.id],
  }),
}))

export type PostImage = InferModel<typeof postMultimedia>
export type NewPostImage = InferModel<typeof postMultimedia, "insert">
