import { and, eq } from "drizzle-orm"
import { webhookDeliveries } from "../../db/schema"
import type { WebhookDeliveryFilter } from "../types/webhooks.types"

export const deliveryListCondition = ({
  webhookId,
  status,
}: WebhookDeliveryFilter) =>
  and(
    eq(webhookDeliveries.webhookId, webhookId),
    status ? eq(webhookDeliveries.status, status) : undefined
  )
