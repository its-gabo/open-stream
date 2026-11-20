import { sql } from "drizzle-orm"
import {
  boolean,
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
import { organizations } from "./organizations.schema"

/** An S3-compatible bucket of an organization that its libraries can store videos in. */
export const storages = pgTable(
  "storages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    endpoint: text("endpoint").notNull(),
    region: text("region").notNull(),
    bucket: text("bucket").notNull(),
    forcePathStyle: boolean("force_path_style").notNull(),
    pathTemplate: text("path_template").notNull(),
    /** Last characters of the access key id, so owners can recognize the key without it being readable. */
    accessKeyIdHint: text("access_key_id_hint").notNull(),
    credentials: jsonb("credentials").$type<EncryptedSecret>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    check("storages_name_check", sql`btrim(${table.name}) <> ''`),
    // Target of the libraries foreign key that keeps a library's storage in its organization.
    unique("storages_id_organization_unique").on(
      table.id,
      table.organizationId
    ),
    index("storages_organization_id_idx").on(table.organizationId),
  ]
)

export type StorageRecord = typeof storages.$inferSelect
export type NewStorageRecord = typeof storages.$inferInsert
