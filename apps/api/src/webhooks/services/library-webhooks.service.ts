import { randomUUID } from "node:crypto"
import {
  ACTIVITY_ACTIONS,
  ACTIVITY_RESOURCE_TYPES,
  WEBHOOK_EVENT_TYPES,
} from "@workspace/shared"
import type { ActivityLogService } from "../../activity/services/activity-log.service"
import type {
  ActivityActor,
  ActivityEntry,
} from "../../activity/types/activity.types"
import { diffActivityValues } from "../../activity/utils/activity-changes.utils"
import { DomainError } from "../../common/errors/domain-error"
import {
  toPageWindow,
  toPaginationDto,
} from "../../common/http/pagination/pagination.utils"
import type { AppConfig } from "../../config/app.config"
import type { DatabaseExecutor } from "../../db/database.types"
import type { LibraryProfile } from "../../libraries/types/libraries.types"
import { libraryActivityContext } from "../../libraries/utils/library-activity.utils"
import { OUTBOX_MESSAGE_TYPES } from "../../outbox/constants/outbox.constants"
import type { OutboxService } from "../../outbox/services/outbox.service"
import type { StorageSecretCipherService } from "../../storage/services/storage-secret-cipher.service"
import { WEBHOOK_SECRET_HINT_LENGTH } from "../constants/webhooks.constants"
import {
  toLibraryWebhookDto,
  toWebhookDeliveryDto,
} from "../dto/webhooks.dto.mappers"
import type {
  LibraryWebhookSaveBody,
  WebhookDeliveryListQuery,
} from "../dto/webhooks.schemas"
import { WEBHOOK_ERRORS } from "../errors/webhooks.errors"
import type { WebhooksRepository } from "../repository/webhooks.repository"
import type { LibraryWebhookChanges } from "../types/webhooks.types"
import { isAllowedWebhookUrl } from "../utils/webhook-url.utils"
import { generateWebhookSecret } from "../utils/webhook-signature.utils"
import type { WebhookEventsService } from "./webhook-events.service"

/**
 * A library's webhook, managed by its owner: the URL events are sent to, the
 * secret that signs them, shown only when created or rolled, and the record
 * of what was sent.
 */
export class LibraryWebhooksService {
  constructor(
    private readonly webhooksRepository: WebhooksRepository,
    private readonly webhookEventsService: WebhookEventsService,
    private readonly outboxService: OutboxService,
    private readonly storageSecretCipherService: StorageSecretCipherService,
    private readonly activityLogService: ActivityLogService,
    private readonly config: AppConfig
  ) {}

  async getWebhook(library: LibraryProfile) {
    const webhook = await this.webhooksRepository.findWebhookOfLibrary(
      library.id
    )

    return { webhook: webhook && toLibraryWebhookDto(webhook) }
  }

  /** Creates the webhook with a new signing secret, or points the existing one at `url` and keeps its secret. */
  async saveWebhook(
    library: LibraryProfile,
    actor: ActivityActor,
    { url }: LibraryWebhookSaveBody
  ) {
    if (
      !isAllowedWebhookUrl(url, {
        allowPrivateNetwork: this.config.WEBHOOK_ALLOW_PRIVATE_URLS,
      })
    ) {
      throw new DomainError(WEBHOOK_ERRORS.URL_NOT_ALLOWED)
    }

    const existing = await this.webhooksRepository.findWebhookOfLibrary(
      library.id
    )
    const signingSecret = existing ? null : generateWebhookSecret()
    const created = signingSecret
      ? await this.webhooksRepository.insertWebhook({
          libraryId: library.id,
          url,
          ...this.toStoredSecret(signingSecret),
        })
      : null

    if (created) {
      await this.recordWebhookActivity(library, actor, created.id, {
        action: ACTIVITY_ACTIONS.WEBHOOK_CREATED,
        after: { url },
      })

      return { webhook: toLibraryWebhookDto(created), signingSecret }
    }

    const updated = await this.updateWebhookOfLibrary(library, { url })

    await this.recordWebhookActivity(library, actor, updated.id, {
      action: ACTIVITY_ACTIONS.WEBHOOK_UPDATED,
      ...diffActivityValues({ url: existing?.url ?? null }, { url }),
    })

    return { webhook: toLibraryWebhookDto(updated), signingSecret: null }
  }

  async deleteWebhook(library: LibraryProfile, actor: ActivityActor) {
    const webhook = await this.findWebhook(library)

    await this.webhooksRepository.deleteWebhook(webhook.id)
    await this.recordWebhookActivity(library, actor, webhook.id, {
      action: ACTIVITY_ACTIONS.WEBHOOK_DELETED,
      before: { url: webhook.url },
    })

    return {}
  }

  /** Replaces the signing secret; deliveries sent from now on are signed with the new one. */
  async rollSigningSecret(library: LibraryProfile, actor: ActivityActor) {
    const signingSecret = generateWebhookSecret()
    const updated = await this.updateWebhookOfLibrary(
      library,
      this.toStoredSecret(signingSecret)
    )

    await this.recordWebhookActivity(library, actor, updated.id, {
      action: ACTIVITY_ACTIONS.WEBHOOK_SECRET_ROLLED,
    })

    return { webhook: toLibraryWebhookDto(updated), signingSecret }
  }

  async sendTestEvent(library: LibraryProfile, actor: ActivityActor) {
    const delivery = await this.webhooksRepository.transaction(
      async (transaction) => {
        const queued = await this.webhookEventsService.publishEvent(
          library.id,
          {
            type: WEBHOOK_EVENT_TYPES.WEBHOOK_TEST,
            data: { libraryId: library.id },
          },
          transaction
        )

        if (!queued) throw new DomainError(WEBHOOK_ERRORS.NOT_FOUND)

        await this.recordWebhookActivity(
          library,
          actor,
          queued.webhookId,
          {
            action: ACTIVITY_ACTIONS.WEBHOOK_TEST_SENT,
            context: { deliveryId: queued.id },
          },
          transaction
        )

        return queued
      }
    )

    return { delivery: toWebhookDeliveryDto(delivery) }
  }

  /** Newest first; an empty page when the library has no webhook. */
  async listDeliveries(
    library: LibraryProfile,
    query: WebhookDeliveryListQuery
  ) {
    const webhook = await this.webhooksRepository.findWebhookOfLibrary(
      library.id
    )

    if (!webhook) {
      return { deliveries: [], pagination: toPaginationDto(query, 0) }
    }

    const filter = { webhookId: webhook.id, status: query.status }
    const [deliveries, totalItems] = await Promise.all([
      this.webhooksRepository.listDeliveryPage(filter, toPageWindow(query)),
      this.webhooksRepository.countDeliveries(filter),
    ])

    return {
      deliveries: deliveries.map(toWebhookDeliveryDto),
      pagination: toPaginationDto(query, totalItems),
    }
  }

  /** Sends a finished delivery again, with its original body and id, to the webhook's current URL. */
  async resendDelivery(
    library: LibraryProfile,
    actor: ActivityActor,
    deliveryId: string
  ) {
    const webhook = await this.findWebhook(library)
    const delivery = await this.webhooksRepository.findDeliveryOfWebhook(
      webhook.id,
      deliveryId
    )

    if (!delivery) throw new DomainError(WEBHOOK_ERRORS.DELIVERY_NOT_FOUND)

    const resent = await this.webhooksRepository.transaction(
      async (transaction) => {
        const pending = await this.webhooksRepository.requestDeliveryResend(
          delivery.id,
          transaction
        )

        if (!pending) throw new DomainError(WEBHOOK_ERRORS.DELIVERY_PENDING)

        await this.recordWebhookActivity(
          library,
          actor,
          webhook.id,
          {
            action: ACTIVITY_ACTIONS.WEBHOOK_DELIVERY_RESENT,
            context: { deliveryId: pending.id, eventType: pending.eventType },
          },
          transaction
        )

        await this.outboxService.publishMessage(
          OUTBOX_MESSAGE_TYPES.DELIVER_WEBHOOK,
          { deliveryId: pending.id, requestId: randomUUID() },
          transaction
        )

        return pending
      }
    )

    return { delivery: toWebhookDeliveryDto(resent) }
  }

  private async recordWebhookActivity(
    library: LibraryProfile,
    actor: ActivityActor,
    webhookId: string,
    {
      context,
      ...entry
    }: Pick<ActivityEntry, "action" | "before" | "after" | "context">,
    executor?: DatabaseExecutor
  ) {
    await this.activityLogService.recordActivity(
      actor,
      {
        organizationId: library.organizationId,
        resource: {
          type: ACTIVITY_RESOURCE_TYPES.WEBHOOK,
          id: webhookId,
          label: library.name,
        },
        context: { ...libraryActivityContext(library), ...context },
        ...entry,
      },
      executor
    )
  }

  private async findWebhook(library: LibraryProfile) {
    const webhook = await this.webhooksRepository.findWebhookOfLibrary(
      library.id
    )

    if (!webhook) throw new DomainError(WEBHOOK_ERRORS.NOT_FOUND)

    return webhook
  }

  private async updateWebhookOfLibrary(
    library: LibraryProfile,
    changes: LibraryWebhookChanges
  ) {
    const webhook = await this.findWebhook(library)
    const updated = await this.webhooksRepository.updateWebhook(
      webhook.id,
      changes
    )

    if (!updated) throw new DomainError(WEBHOOK_ERRORS.NOT_FOUND)

    return updated
  }

  private toStoredSecret(signingSecret: string) {
    return {
      signingSecret: this.storageSecretCipherService.encrypt(signingSecret),
      signingSecretHint: signingSecret.slice(-WEBHOOK_SECRET_HINT_LENGTH),
    }
  }
}
