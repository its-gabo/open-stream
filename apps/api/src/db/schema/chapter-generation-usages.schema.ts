import { sql } from "drizzle-orm"
import {
  check,
  index,
  integer,
  pgTable,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core"
import { chapterGenerationProviders } from "./chapter-generation-providers.schema"
import { organizations } from "./organizations.schema"
import { users } from "./users.schema"

/**
 * One request for a video's chapters and the tokens it used, counted
 * against its provider's monthly limit. While the provider answers, the
 * row holds an estimate, so requests made meanwhile cannot go past the
 * limit together; the provider's own count replaces it once known.
 */
export const chapterGenerationUsages = pgTable(
  "chapter_generation_usages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    providerId: uuid("provider_id")
      .notNull()
      .references(() => chapterGenerationProviders.id, { onDelete: "cascade" }),
    /** The video chapters were asked for; kept after it is deleted, as the tokens were still used. */
    videoId: uuid("video_id").notNull(),
    requestedById: uuid("requested_by_id").references(() => users.id, {
      onDelete: "set null",
    }),
    /** Tokens read and written; an estimate until the provider answers. */
    tokens: integer("tokens").notNull(),
    /** When the provider answered or failed; null while it is being asked. */
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check("chapter_generation_usages_tokens_check", sql`${table.tokens} >= 0`),
    index("chapter_generation_usages_provider_id_created_at_idx").on(
      table.providerId,
      table.createdAt
    ),
    index("chapter_generation_usages_organization_id_idx").on(
      table.organizationId
    ),
  ]
)

export type ChapterGenerationUsageRecord =
  typeof chapterGenerationUsages.$inferSelect
export type NewChapterGenerationUsageRecord =
  typeof chapterGenerationUsages.$inferInsert
