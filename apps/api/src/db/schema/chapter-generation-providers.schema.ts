import {
  CHAPTER_GENERATION_PROVIDER_KINDS,
  type ChapterGenerationProviderKind,
} from "@workspace/shared"
import { sql } from "drizzle-orm"
import {
  check,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core"
import type { EncryptedSecret } from "../../storage/types/storage.types"
import { checkOneOf } from "../database.utils"
import { organizations } from "./organizations.schema"

/** A language model service an organization connects once and assigns to any of its libraries, to write chapters from captions. */
export const chapterGenerationProviders = pgTable(
  "chapter_generation_providers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    kind: text("kind", {
      enum: [
        CHAPTER_GENERATION_PROVIDER_KINDS.OPENAI,
        CHAPTER_GENERATION_PROVIDER_KINDS.OPENAI_COMPATIBLE,
      ],
    })
      .$type<ChapterGenerationProviderKind>()
      .notNull(),
    /** The API's root; null for OpenAI, which is always reached at its own address. */
    baseUrl: text("base_url"),
    /** Last characters of the API key, so owners can recognize it without it being readable. */
    apiKeyHint: text("api_key_hint"),
    /** Null when the server asks for no key. */
    apiKey: jsonb("api_key").$type<EncryptedSecret>(),
    /** Tokens, read and written, it may use each calendar month (UTC); null for no limit. */
    monthlyTokenLimit: integer("monthly_token_limit"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    checkOneOf(
      "chapter_generation_providers_kind_check",
      table.kind,
      Object.values(CHAPTER_GENERATION_PROVIDER_KINDS)
    ),
    check(
      "chapter_generation_providers_name_check",
      sql`btrim(${table.name}) <> ''`
    ),
    check(
      "chapter_generation_providers_base_url_check",
      sql`(${table.kind} = 'openai') = (${table.baseUrl} is null)`
    ),
    check(
      "chapter_generation_providers_api_key_check",
      sql`(${table.apiKeyHint} is null) = (${table.apiKey} is null) and (${table.kind} <> 'openai' or ${table.apiKey} is not null)`
    ),
    check(
      "chapter_generation_providers_monthly_token_limit_check",
      sql`${table.monthlyTokenLimit} is null or ${table.monthlyTokenLimit} > 0`
    ),
    // Target of the libraries foreign key that keeps a library's provider in its organization.
    unique("chapter_generation_providers_id_organization_unique").on(
      table.id,
      table.organizationId
    ),
    index("chapter_generation_providers_organization_id_idx").on(
      table.organizationId
    ),
  ]
)

export type ChapterGenerationProviderRecord =
  typeof chapterGenerationProviders.$inferSelect
export type NewChapterGenerationProviderRecord =
  typeof chapterGenerationProviders.$inferInsert
