import {
  ACTIVITY_ACTIONS,
  CHAPTER_GENERATION_PROVIDER_KINDS,
  CHAPTER_GENERATION_PROVIDER_LIMITS,
  OPENAI_CHAPTER_GENERATION_BASE_URL,
} from "@workspace/shared"
import type { ActivityLogService } from "../../activity/services/activity-log.service"
import type { ActivityActor } from "../../activity/types/activity.types"
import { diffActivityValues } from "../../activity/utils/activity-changes.utils"
import { DomainError } from "../../common/errors/domain-error"
import { startOfUtcMonth } from "../../common/utils/date.utils"
import { isAllowedServiceEndpoint } from "../../common/network/service-endpoint.utils"
import type { AppConfig } from "../../config/app.config"
import type { ChapterGenerationProviderRecord } from "../../db/schema"
import type { OrganizationAccess } from "../../organizations/types/organizations.types"
import type { StorageSecretCipherService } from "../../storage/services/storage-secret-cipher.service"
import { toChapterGenerationProviderDto } from "../dto/chapter-generation.dto.mappers"
import type {
  ChapterGenerationProviderCreateBody,
  ChapterGenerationProviderUpdateBody,
} from "../dto/chapter-generation.schemas"
import { CHAPTER_GENERATION_ERRORS } from "../errors/chapter-generation.errors"
import type { ChapterGenerationProvidersRepository } from "../repository/chapter-generation-providers.repository"
import {
  CHAPTER_GENERATION_MAX_OUTPUT_TOKENS,
  CHAPTER_GENERATION_MIN_OUTPUT_TOKENS,
  CHAPTER_GENERATION_RESERVATION_GRACE_MS,
} from "../constants/chapter-generation.constants"
import type {
  ChapterGenerationClient,
  ChapterGenerationEndpoint,
  TokenReservation,
  TokenUsageWindow,
} from "../types/chapter-generation.types"
import {
  chapterGenerationProviderActivityResource,
  toChapterGenerationProviderActivityValues,
} from "../utils/chapter-generation-activity.utils"

/** Last characters of an API key shown to owners. */
const API_KEY_HINT_LENGTH = 4

/**
 * Language model services an organization connects once and assigns to any
 * of its libraries to write chapters: OpenAI, or a server of its own
 * speaking OpenAI's API, each asked for the model its owner chose. API keys are
 * stored encrypted and never returned.
 */
export class ChapterGenerationProvidersService {
  constructor(
    private readonly chapterGenerationProvidersRepository: ChapterGenerationProvidersRepository,
    private readonly chapterGenerationClient: ChapterGenerationClient,
    private readonly storageSecretCipherService: StorageSecretCipherService,
    private readonly activityLogService: ActivityLogService,
    private readonly config: AppConfig
  ) {}

  findProvider(organizationId: string, providerId: string) {
    return this.chapterGenerationProvidersRepository.findProvider(
      organizationId,
      providerId
    )
  }

  async listProviders(access: OrganizationAccess) {
    const [providers, usage] = await Promise.all([
      this.chapterGenerationProvidersRepository.listProviderSummaries(
        access.organization.id
      ),
      this.chapterGenerationProvidersRepository.sumTokensUsedByProvider(
        access.organization.id,
        this.usageWindow()
      ),
    ])
    const tokensUsed = new Map(
      usage.map(({ providerId, tokens }) => [providerId, tokens])
    )

    return {
      providers: providers.map((provider) =>
        toChapterGenerationProviderDto({
          ...provider,
          tokensUsedThisMonth: tokensUsed.get(provider.id) ?? 0,
        })
      ),
    }
  }

  /**
   * Holds the provider's monthly limit for one request: `inputTokens`, and
   * room for the answer up to `CHAPTER_GENERATION_MAX_OUTPUT_TOKENS`, or as
   * much as the limit leaves. Requests made meanwhile cannot pass the limit
   * together. Refused when the limit leaves less than
   * `CHAPTER_GENERATION_MIN_OUTPUT_TOKENS` for the answer.
   */
  async reserveTokens(
    provider: ChapterGenerationProviderRecord,
    request: {
      videoId: string
      requestedById: string | null
      inputTokens: number
    }
  ): Promise<TokenReservation> {
    return this.chapterGenerationProvidersRepository.transaction(
      async (transaction) => {
        const locked =
          await this.chapterGenerationProvidersRepository.lockProvider(
            provider.organizationId,
            provider.id,
            transaction
          )

        if (!locked)
          throw new DomainError(CHAPTER_GENERATION_ERRORS.NOT_CONFIGURED)

        const remaining =
          locked.monthlyTokenLimit === null
            ? Number.POSITIVE_INFINITY
            : locked.monthlyTokenLimit -
              (await this.chapterGenerationProvidersRepository.sumTokensUsed(
                locked.id,
                this.usageWindow(),
                transaction
              ))
        const maxOutputTokens = Math.min(
          CHAPTER_GENERATION_MAX_OUTPUT_TOKENS,
          remaining - request.inputTokens
        )

        if (maxOutputTokens < CHAPTER_GENERATION_MIN_OUTPUT_TOKENS) {
          throw new DomainError(CHAPTER_GENERATION_ERRORS.USAGE_LIMIT_REACHED)
        }

        const usage =
          await this.chapterGenerationProvidersRepository.insertUsage(
            {
              organizationId: locked.organizationId,
              providerId: locked.id,
              videoId: request.videoId,
              model: locked.model,
              requestedById: request.requestedById,
              tokens: request.inputTokens + maxOutputTokens,
            },
            transaction
          )

        return { usageId: usage.id, maxOutputTokens }
      }
    )
  }

  /** Replaces a reservation with the tokens the request used. */
  settleTokens(usageId: string, tokens: number) {
    return this.chapterGenerationProvidersRepository.finishUsage(
      usageId,
      tokens
    )
  }

  async createProvider(
    access: OrganizationAccess,
    actor: ActivityActor,
    input: ChapterGenerationProviderCreateBody
  ) {
    const baseUrl =
      input.kind === CHAPTER_GENERATION_PROVIDER_KINDS.OPENAI_COMPATIBLE
        ? input.baseUrl
        : null

    if (baseUrl) this.assertEndpointAllowed(baseUrl)

    const created = await this.chapterGenerationProvidersRepository.transaction(
      async (transaction) => {
        if (
          (await this.chapterGenerationProvidersRepository.countProviders(
            access.organization.id,
            transaction
          )) >= CHAPTER_GENERATION_PROVIDER_LIMITS.MAX_PER_ORGANIZATION
        ) {
          throw new DomainError(
            CHAPTER_GENERATION_ERRORS.PROVIDER_LIMIT_REACHED
          )
        }

        const provider =
          await this.chapterGenerationProvidersRepository.insertProvider(
            {
              organizationId: access.organization.id,
              name: input.name,
              kind: input.kind,
              baseUrl,
              model: input.model,
              monthlyTokenLimit: input.monthlyTokenLimit,
              ...this.encryptApiKey(input.apiKey),
            },
            transaction
          )

        await this.activityLogService.recordActivity(
          actor,
          {
            organizationId: access.organization.id,
            action: ACTIVITY_ACTIONS.CHAPTER_GENERATION_PROVIDER_CREATED,
            resource: chapterGenerationProviderActivityResource(provider),
            after: toChapterGenerationProviderActivityValues(provider),
          },
          transaction
        )

        return provider
      }
    )

    return {
      provider: toChapterGenerationProviderDto({
        ...created,
        libraryCount: 0,
        tokensUsedThisMonth: 0,
      }),
    }
  }

  /**
   * The kind stays; OpenAI keeps its own address and always has a key. A
   * saved key is never sent to a new address: changing the address removes
   * it unless the update brings a key along.
   */
  async updateProvider(
    provider: ChapterGenerationProviderRecord,
    actor: ActivityActor,
    input: ChapterGenerationProviderUpdateBody
  ) {
    const isOpenAi = provider.kind === CHAPTER_GENERATION_PROVIDER_KINDS.OPENAI

    if (isOpenAi && input.apiKey === null) {
      throw new DomainError(CHAPTER_GENERATION_ERRORS.PROVIDER_API_KEY_REQUIRED)
    }

    const updated = await this.chapterGenerationProvidersRepository.transaction(
      async (transaction) => {
        const locked =
          await this.chapterGenerationProvidersRepository.lockProvider(
            provider.organizationId,
            provider.id,
            transaction
          )

        if (!locked)
          throw new DomainError(CHAPTER_GENERATION_ERRORS.PROVIDER_NOT_FOUND)

        const baseUrl = isOpenAi ? null : (input.baseUrl ?? locked.baseUrl)
        const isAddressChanged = baseUrl !== locked.baseUrl

        if (baseUrl && isAddressChanged) {
          this.assertEndpointAllowed(baseUrl)
        }

        const apiKey = isAddressChanged ? (input.apiKey ?? null) : input.apiKey

        const changed =
          await this.chapterGenerationProvidersRepository.updateProvider(
            provider.id,
            {
              name: input.name,
              baseUrl,
              model: input.model,
              ...(input.monthlyTokenLimit !== undefined && {
                monthlyTokenLimit: input.monthlyTokenLimit,
              }),
              ...(apiKey !== undefined && this.encryptApiKey(apiKey)),
            },
            transaction
          )

        if (!changed)
          throw new DomainError(CHAPTER_GENERATION_ERRORS.PROVIDER_NOT_FOUND)

        await this.activityLogService.recordActivity(
          actor,
          {
            organizationId: provider.organizationId,
            action: ACTIVITY_ACTIONS.CHAPTER_GENERATION_PROVIDER_UPDATED,
            resource: chapterGenerationProviderActivityResource(changed),
            ...diffActivityValues(
              toChapterGenerationProviderActivityValues(locked),
              toChapterGenerationProviderActivityValues(changed)
            ),
            context: {
              apiKeyChanged:
                apiKey !== undefined &&
                (apiKey !== null || locked.apiKeyHint !== null),
            },
          },
          transaction
        )

        return changed
      }
    )

    return this.reloadProvider(updated.organizationId, updated.id)
  }

  /** A provider libraries still use cannot be deleted. */
  async deleteProvider(
    provider: ChapterGenerationProviderRecord,
    actor: ActivityActor
  ) {
    await this.chapterGenerationProvidersRepository.transaction(
      async (transaction) => {
        const locked =
          await this.chapterGenerationProvidersRepository.lockProvider(
            provider.organizationId,
            provider.id,
            transaction
          )

        if (!locked)
          throw new DomainError(CHAPTER_GENERATION_ERRORS.PROVIDER_NOT_FOUND)

        if (
          (await this.chapterGenerationProvidersRepository.countLibrariesUsingProvider(
            provider.id,
            transaction
          )) > 0
        ) {
          throw new DomainError(CHAPTER_GENERATION_ERRORS.PROVIDER_IN_USE)
        }

        await this.chapterGenerationProvidersRepository.deleteProvider(
          provider.id,
          transaction
        )
        await this.activityLogService.recordActivity(
          actor,
          {
            organizationId: provider.organizationId,
            action: ACTIVITY_ACTIONS.CHAPTER_GENERATION_PROVIDER_DELETED,
            resource: chapterGenerationProviderActivityResource(locked),
            before: toChapterGenerationProviderActivityValues(locked),
          },
          transaction
        )
      }
    )

    return {}
  }

  /** Asks the saved provider for its models, which checks the address and the key without generating anything. */
  async testProvider(provider: ChapterGenerationProviderRecord) {
    const endpoint = this.toEndpoint(provider)

    if (!this.isEndpointAllowed(endpoint.baseUrl)) {
      return { connection: { isReachable: false, isAuthorized: false } }
    }

    return {
      connection: await this.chapterGenerationClient.testConnection(endpoint),
    }
  }

  /** Where and how to reach the provider, its key decrypted. */
  toEndpoint(
    provider: ChapterGenerationProviderRecord
  ): ChapterGenerationEndpoint {
    return {
      kind: provider.kind,
      baseUrl: provider.baseUrl ?? OPENAI_CHAPTER_GENERATION_BASE_URL,
      model: provider.model,
      apiKey: provider.apiKey
        ? this.storageSecretCipherService.decrypt(provider.apiKey)
        : null,
    }
  }

  /** Checked again before each request, as the config may have changed since the provider was saved. */
  isEndpointAllowed(baseUrl: string) {
    return isAllowedServiceEndpoint(baseUrl, {
      allowPrivateNetwork:
        this.config.CHAPTER_GENERATION_ALLOW_PRIVATE_ENDPOINTS,
    })
  }

  private async reloadProvider(organizationId: string, providerId: string) {
    const [provider, tokensUsed] = await Promise.all([
      this.chapterGenerationProvidersRepository.findProviderSummary(
        organizationId,
        providerId
      ),
      this.chapterGenerationProvidersRepository.sumTokensUsed(
        providerId,
        this.usageWindow()
      ),
    ])

    if (!provider)
      throw new DomainError(CHAPTER_GENERATION_ERRORS.PROVIDER_NOT_FOUND)

    return {
      provider: toChapterGenerationProviderDto({
        ...provider,
        tokensUsedThisMonth: tokensUsed,
      }),
    }
  }

  /** This month's usage; a reservation left unsettled past its request's timeout no longer counts. */
  private usageWindow(): TokenUsageWindow {
    return {
      since: startOfUtcMonth(),
      unsettledSince: new Date(
        Date.now() -
          this.config.CHAPTER_GENERATION_REQUEST_TIMEOUT_MS -
          CHAPTER_GENERATION_RESERVATION_GRACE_MS
      ),
    }
  }

  private assertEndpointAllowed(baseUrl: string) {
    if (!this.isEndpointAllowed(baseUrl)) {
      throw new DomainError(
        CHAPTER_GENERATION_ERRORS.PROVIDER_ENDPOINT_NOT_ALLOWED
      )
    }
  }

  private encryptApiKey(apiKey: string | null) {
    return apiKey
      ? {
          apiKeyHint: apiKey.slice(-API_KEY_HINT_LENGTH),
          apiKey: this.storageSecretCipherService.encrypt(apiKey),
        }
      : { apiKeyHint: null, apiKey: null }
  }
}
