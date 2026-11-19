import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"
import { videos } from "./videos.schema"

/**
 * The import in progress for a video; deleted once it finishes or fails, or
 * when a newer import or upload replaces it, so a replaced run finds it gone.
 * Changed only under the video's row lock.
 */
export const videoImports = pgTable("video_imports", {
  id: uuid("id").primaryKey().defaultRandom(),
  videoId: uuid("video_id")
    .notNull()
    .unique()
    .references(() => videos.id, { onDelete: "cascade" }),
  /** May hold a token, so only its host is shown. */
  url: text("url").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
})

export type VideoImportRecord = typeof videoImports.$inferSelect
export type NewVideoImportRecord = typeof videoImports.$inferInsert
