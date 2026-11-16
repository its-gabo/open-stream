import { WEBHOOK_DELIVERY_STATUSES } from "@workspace/shared"
import {
  PrivateAddressError,
  lookupPublicAddress,
} from "../../common/network/public-address-lookup.utils"
import type { Logger } from "../../common/logging/logger"
import { DAY_MS } from "../../common/time/time.constants"
import { getErrorMessage } from "../../common/utils/error.utils"
import type { AppConfig } from "../../config/app.config"
import type {
  LibraryWebhookRecord,
  WebhookDeliveryRecord,
} from "../../db/schema"
import type { StorageSecretCipherService } from "../../storage/services/storage-secret-cipher.service"
import {
  WEBHOOK_DELIVERY_RETENTION_DAYS,
  WEBHOOK_ERROR_MAX_LENGTH,
  WEBHOOK_HEADERS,
  WEBHOOK_REQUEST_TIMEOUT_MS,
  WEBHOOK_USER_AGENT,
} from "../constants/webhooks.constants"
import type { WebhooksRepository } from "../repository/webhooks.repository"
import type {
  DeliverWebhookPayload,
  WebhookAttemptResult,
} from "../types/webhooks.types"
import { isAllowedWebhookUrl } from "../utils/webhook-url.utils"
import { signWebhook } from "../utils/webhook-signature.utils"
import {
  WebhookTimeoutError,
  postWebhookRequest,
} from "../utils/webhook-request.utils"
import { WebhookDeliveryError } from "../errors/webhook-delivery.error"

/**
 * Sends a recorded event to its library's webhook as a signed POST, per the
 * Standard Webhooks specification. Any 2xx answer delivers it; redirects are
 * not followed.
 */
export class WebhookDeliveryService {
  constructor(
    private readonly webhooksRepository: WebhooksRepository,
    private readonly storageSecretCipherService: StorageSecretCipherService,
    private readonly logger: Logger,
    private readonly config: AppConfig
  ) {}

  /** Makes one attempt; throws `WebhookDeliveryError` when a later attempt could still succeed. */
  async deliverWebhook(
    { deliveryId }: DeliverWebhookPayload,
    { isFinalAttempt }: { isFinalAttempt: boolean }
  ) {
    const delivery = await this.webhooksRepository.findDelivery(deliveryId)

    if (delivery?.status !== WEBHOOK_DELIVERY_STATUSES.PENDING) return

    const webhook = await this.webhooksRepository.findWebhook(
      delivery.webhookId
    )

    if (!webhook) return

    const attemptedAt = new Date()
    const result = await this.sendDelivery(webhook, delivery)

    const logContext = {
      deliveryId: delivery.id,
      eventType: delivery.eventType,
      host: new URL(webhook.url).host,
      status: result.responseStatus ?? undefined,
    }

    if (result.isDelivered) {
      this.logger.info("Delivered", logContext)
      await this.webhooksRepository.recordDeliveryAttempt(delivery.id, {
        status: WEBHOOK_DELIVERY_STATUSES.SUCCEEDED,
        responseStatus: result.responseStatus,
        lastError: null,
        attemptedAt,
      })

      return
    }

    const isFailed = result.isPermanent || isFinalAttempt

    if (result.isPermanent) {
      this.logger.warn("Not sent", { ...logContext, reason: result.error })
    }

    await this.webhooksRepository.recordDeliveryAttempt(delivery.id, {
      status: isFailed
        ? WEBHOOK_DELIVERY_STATUSES.FAILED
        : WEBHOOK_DELIVERY_STATUSES.PENDING,
      responseStatus: result.responseStatus,
      lastError: result.error.slice(0, WEBHOOK_ERROR_MAX_LENGTH),
      attemptedAt,
    })

    if (!result.isPermanent) throw new WebhookDeliveryError(result.error)
  }

  /** Removes finished deliveries past their retention; returns how many. */
  async deleteExpiredDeliveries() {
    const deletedCount =
      await this.webhooksRepository.deleteFinishedDeliveriesBefore(
        new Date(Date.now() - WEBHOOK_DELIVERY_RETENTION_DAYS * DAY_MS)
      )

    if (deletedCount > 0) {
      this.logger.info("Removed expired deliveries", { count: deletedCount })
    }

    return deletedCount
  }

  private async sendDelivery(
    webhook: LibraryWebhookRecord,
    delivery: WebhookDeliveryRecord
  ): Promise<WebhookAttemptResult> {
    const allowPrivateNetwork = this.config.WEBHOOK_ALLOW_PRIVATE_URLS

    if (!isAllowedWebhookUrl(webhook.url, { allowPrivateNetwork })) {
      return permanentFailure("The URL must be a public HTTPS address")
    }

    const body = JSON.stringify(delivery.payload)
    const timestamp = Math.floor(Date.now() / 1000)
    const signature = signWebhook(
      this.storageSecretCipherService.decrypt(webhook.signingSecret),
      { id: delivery.id, timestamp, body }
    )

    try {
      const responseStatus = await postWebhookRequest(webhook.url, {
        headers: {
          "content-type": "application/json",
          "user-agent": WEBHOOK_USER_AGENT,
          [WEBHOOK_HEADERS.ID]: delivery.id,
          [WEBHOOK_HEADERS.TIMESTAMP]: String(timestamp),
          [WEBHOOK_HEADERS.SIGNATURE]: signature,
        },
        body,
        timeoutMs: WEBHOOK_REQUEST_TIMEOUT_MS,
        // The host may point at a private address even when its name does
        // not look like it, so the address the request connects to is checked.
        lookup: allowPrivateNetwork ? undefined : lookupPublicAddress,
      })

      if (responseStatus >= 200 && responseStatus < 300) {
        return { isDelivered: true, responseStatus }
      }

      return {
        isDelivered: false,
        responseStatus,
        error: `The endpoint answered ${responseStatus}`,
        isPermanent: false,
      }
    } catch (error) {
      if (error instanceof PrivateAddressError) {
        return permanentFailure("The host resolves to a private address")
      }

      return {
        isDelivered: false,
        responseStatus: null,
        error:
          error instanceof WebhookTimeoutError
            ? `The endpoint did not answer within ${WEBHOOK_REQUEST_TIMEOUT_MS / 1000} seconds`
            : `The request failed: ${getErrorMessage(error)}`,
        isPermanent: false,
      }
    }
  }
}

const permanentFailure = (error: string): WebhookAttemptResult => ({
  isDelivered: false,
  responseStatus: null,
  error,
  isPermanent: true,
})
