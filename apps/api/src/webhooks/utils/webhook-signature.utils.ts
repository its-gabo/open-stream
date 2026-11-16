import { createHmac, randomBytes } from "node:crypto"
import {
  WEBHOOK_SECRET_BYTES,
  WEBHOOK_SECRET_PREFIX,
  WEBHOOK_SIGNATURE_VERSION,
} from "../constants/webhooks.constants"

export const generateWebhookSecret = () =>
  `${WEBHOOK_SECRET_PREFIX}${randomBytes(WEBHOOK_SECRET_BYTES).toString("base64")}`

/**
 * The `webhook-signature` header of the Standard Webhooks specification:
 * an HMAC-SHA256 of `<id>.<timestamp>.<body>`, keyed with the secret's
 * base64 part.
 */
export const signWebhook = (
  secret: string,
  { id, timestamp, body }: { id: string; timestamp: number; body: string }
) => {
  const key = Buffer.from(secret.slice(WEBHOOK_SECRET_PREFIX.length), "base64")
  const signature = createHmac("sha256", key)
    .update(`${id}.${timestamp}.${body}`)
    .digest("base64")

  return `${WEBHOOK_SIGNATURE_VERSION},${signature}`
}
