import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"
import { AUTH_TOKEN_PURPOSES } from "../../auth/constants/auth.constants"
import { checkOneOf } from "../database.utils"
import { users } from "./users.schema"

export const authTokens = pgTable(
  "auth_tokens",
  {
    tokenHash: text("token_hash").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    purpose: text("purpose", {
      enum: [
        AUTH_TOKEN_PURPOSES.VERIFY_EMAIL,
        AUTH_TOKEN_PURPOSES.RESET_PASSWORD,
      ],
    }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    checkOneOf(
      "auth_tokens_purpose_check",
      table.purpose,
      Object.values(AUTH_TOKEN_PURPOSES)
    ),
    index("auth_tokens_user_id_idx").on(table.userId),
  ]
)

export type AuthTokenRecord = typeof authTokens.$inferSelect
export type NewAuthTokenRecord = typeof authTokens.$inferInsert
