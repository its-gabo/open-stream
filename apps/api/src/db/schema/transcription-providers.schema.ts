import {
  TRANSCRIPTION_PROVIDER_KINDS,
  type TranscriptionProviderKind,
} from "@workspace/shared"
import { sql } from "drizzle-orm"
import {
  check,
  index,
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

/** A speech-to-text service an organization connects once and assigns to any of its libraries. */
export const transcriptionProviders = pgTable(
  "transcription_providers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    kind: text("kind", {
      enum: [
        TRANSCRIPTION_PROVIDER_KINDS.OPENAI,
        TRANSCRIPTION_PROVIDER_KINDS.OPENAI_COMPATIBLE,
      ],
    })
      .$type<TranscriptionProviderKind>()
      .notNull(),
    /** The API's root; null for OpenAI, which is always reached at its own address. */
    baseUrl: text("base_url"),
    model: text("model").notNull(),
    /** Last characters of the API key, so owners can recognize it without it being readable. */
    apiKeyHint: text("api_key_hint"),
    /** Null when the server asks for no key. */
    apiKey: jsonb("api_key").$type<EncryptedSecret>(),
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
      "transcription_providers_kind_check",
      table.kind,
      Object.values(TRANSCRIPTION_PROVIDER_KINDS)
    ),
    check(
      "transcription_providers_name_check",
      sql`btrim(${table.name}) <> '' and btrim(${table.model}) <> ''`
    ),
    check(
      "transcription_providers_base_url_check",
      sql`(${table.kind} = 'openai') = (${table.baseUrl} is null)`
    ),
    check(
      "transcription_providers_api_key_check",
      sql`(${table.apiKeyHint} is null) = (${table.apiKey} is null) and (${table.kind} <> 'openai' or ${table.apiKey} is not null)`
    ),
    // Target of the libraries foreign key that keeps a library's provider in its organization.
    unique("transcription_providers_id_organization_unique").on(
      table.id,
      table.organizationId
    ),
    index("transcription_providers_organization_id_idx").on(
      table.organizationId
    ),
  ]
)

export type TranscriptionProviderRecord =
  typeof transcriptionProviders.$inferSelect
export type NewTranscriptionProviderRecord =
  typeof transcriptionProviders.$inferInsert
