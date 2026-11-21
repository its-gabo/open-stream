import {
  ACTIVITY_ACTIONS,
  OPENAI_TRANSCRIPTION_DEFAULTS,
  TRANSCRIPTION_PROVIDER_KINDS,
  TRANSCRIPTION_PROVIDER_LIMITS,
} from "@workspace/shared"
import type { ActivityLogService } from "../../activity/services/activity-log.service"
import type { ActivityActor } from "../../activity/types/activity.types"
import { diffActivityValues } from "../../activity/utils/activity-changes.utils"
import { DomainError } from "../../common/errors/domain-error"
import { startOfUtcMonth } from "../../common/utils/date.utils"
import { isAllowedServiceEndpoint } from "../../common/network/service-endpoint.utils"
import type { AppConfig } from "../../config/app.config"
import type { DatabaseExecutor, Transaction } from "../../db/database.types"
import type { TranscriptionProviderRecord } from "../../db/schema"
import type { OrganizationAccess } from "../../organizations/types/organizations.types"
import type { StorageSecretCipherService } from "../../storage/services/storage-secret-cipher.service"
import { toTranscriptionProviderDto } from "../dto/captions.dto.mappers"
import type {
  TranscriptionProviderCreateBody,
  TranscriptionProviderUpdateBody,
} from "../dto/captions.schemas"
import { VIDEO_CAPTION_ERRORS } from "../errors/captions.errors"
import type { TranscriptionProvidersRepository } from "../repository/transcription-providers.repository"
import type {
  TranscriptionClient,
  TranscriptionEndpoint,
} from "../types/captions.types"
import {
  toTranscriptionProviderActivityValues,
  transcriptionProviderActivityResource,
} from "../utils/caption-activity.utils"

/** Last characters of an API key shown to owners. */
const API_KEY_HINT_LENGTH = 4

/**
 * Speech-to-text services an organization connects once and assigns to any
 * of its libraries: OpenAI, or a server of its own speaking OpenAI's API.
 * API keys are stored encrypted and never returned.
 */
export class TranscriptionProvidersService {
  constructor(
    private readonly transcriptionProvidersRepository: TranscriptionProvidersRepository,
    private readonly transcriptionClient: TranscriptionClient,
    private readonly storageSecretCipherService: StorageSecretCipherService,
    private readonly activityLogService: ActivityLogService,
    private readonly config: AppConfig
  ) {}

  findProvider(
    organizationId: string,
    providerId: string,
    executor?: DatabaseExecutor
  ) {
    return this.transcriptionProvidersRepository.findProvider(
      organizationId,
      providerId,
      executor
    )
  }

  /** Locks the provider for the rest of the transaction, e.g. so two requests cannot both take its last minutes. */
  lockProvider(
    organizationId: string,
    providerId: string,
    transaction: Transaction
  ) {
    return this.transcriptionProvidersRepository.lockProvider(
      organizationId,
      providerId,
      transaction
    )
  }

  /**
   * Whether the provider may transcribe `audioSeconds` more this month
   * without passing its limit. Hold its lock, so nothing is counted
   * meanwhile.
   */
  async hasMinutesLeftFor(
    provider: TranscriptionProviderRecord,
    audioSeconds: number,
    transaction: Transaction
  ) {
    if (provider.monthlyMinuteLimit === null) return true

    const usedSeconds =
      await this.transcriptionProvidersRepository.sumAudioSecondsSince(
        provider.id,
        startOfUtcMonth(),
        transaction
      )

    return usedSeconds + audioSeconds <= provider.monthlyMinuteLimit * 60
  }

  async listProviders(access: OrganizationAccess) {
    const [providers, usage] = await Promise.all([
      this.transcriptionProvidersRepository.listProviderSummaries(
        access.organization.id
      ),
      this.transcriptionProvidersRepository.sumAudioSecondsByProviderSince(
        access.organization.id,
        startOfUtcMonth()
      ),
    ])
    const usedSeconds = new Map(
      usage.map(({ providerId, seconds }) => [providerId, seconds])
    )

    return {
      providers: providers.map((provider) =>
        toTranscriptionProviderDto({
          ...provider,
          usedAudioSecondsThisMonth: usedSeconds.get(provider.id) ?? 0,
        })
      ),
    }
  }

  async createProvider(
    access: OrganizationAccess,
    actor: ActivityActor,
    input: TranscriptionProviderCreateBody
  ) {
    const baseUrl =
      input.kind === TRANSCRIPTION_PROVIDER_KINDS.OPENAI_COMPATIBLE
        ? input.baseUrl
        : null

    if (baseUrl) this.assertEndpointAllowed(baseUrl)

    const created = await this.transcriptionProvidersRepository.transaction(
      async (transaction) => {
        if (
          (await this.transcriptionProvidersRepository.countProviders(
            access.organization.id,
            transaction
          )) >= TRANSCRIPTION_PROVIDER_LIMITS.MAX_PER_ORGANIZATION
        ) {
          throw new DomainError(VIDEO_CAPTION_ERRORS.PROVIDER_LIMIT_REACHED)
        }

        const provider =
          await this.transcriptionProvidersRepository.insertProvider(
            {
              organizationId: access.organization.id,
              name: input.name,
              kind: input.kind,
              baseUrl,
              model: input.model,
              monthlyMinuteLimit: input.monthlyMinuteLimit,
              ...this.encryptApiKey(input.apiKey),
            },
            transaction
          )

        await this.activityLogService.recordActivity(
          actor,
          {
            organizationId: access.organization.id,
            action: ACTIVITY_ACTIONS.TRANSCRIPTION_PROVIDER_CREATED,
            resource: transcriptionProviderActivityResource(provider),
            after: toTranscriptionProviderActivityValues(provider),
          },
          transaction
        )

        return provider
      }
    )

    return {
      provider: toTranscriptionProviderDto({
        ...created,
        libraryCount: 0,
        usedAudioSecondsThisMonth: 0,
      }),
    }
  }

  /**
   * The kind stays; OpenAI keeps its own address and always has a key. A
   * saved key is never sent to a new address: changing the address removes
   * it unless the update brings a key along.
   */
  async updateProvider(
    provider: TranscriptionProviderRecord,
    actor: ActivityActor,
    input: TranscriptionProviderUpdateBody
  ) {
    const isOpenAi = provider.kind === TRANSCRIPTION_PROVIDER_KINDS.OPENAI

    if (isOpenAi && input.apiKey === null) {
      throw new DomainError(VIDEO_CAPTION_ERRORS.PROVIDER_API_KEY_REQUIRED)
    }

    const updated = await this.transcriptionProvidersRepository.transaction(
      async (transaction) => {
        const locked = await this.transcriptionProvidersRepository.lockProvider(
          provider.organizationId,
          provider.id,
          transaction
        )

        if (!locked)
          throw new DomainError(VIDEO_CAPTION_ERRORS.PROVIDER_NOT_FOUND)

        const baseUrl = isOpenAi ? null : (input.baseUrl ?? locked.baseUrl)
        const isAddressChanged = baseUrl !== locked.baseUrl

        if (baseUrl && isAddressChanged) {
          this.assertEndpointAllowed(baseUrl)
        }

        const apiKey = isAddressChanged ? (input.apiKey ?? null) : input.apiKey

        const changed =
          await this.transcriptionProvidersRepository.updateProvider(
            provider.id,
            {
              name: input.name,
              baseUrl,
              model: input.model,
              ...(input.monthlyMinuteLimit !== undefined && {
                monthlyMinuteLimit: input.monthlyMinuteLimit,
              }),
              ...(apiKey !== undefined && this.encryptApiKey(apiKey)),
            },
            transaction
          )

        if (!changed)
          throw new DomainError(VIDEO_CAPTION_ERRORS.PROVIDER_NOT_FOUND)

        await this.activityLogService.recordActivity(
          actor,
          {
            organizationId: provider.organizationId,
            action: ACTIVITY_ACTIONS.TRANSCRIPTION_PROVIDER_UPDATED,
            resource: transcriptionProviderActivityResource(changed),
            ...diffActivityValues(
              toTranscriptionProviderActivityValues(locked),
              toTranscriptionProviderActivityValues(changed)
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

  /** A provider libraries still use cannot be deleted; past transcriptions keep their model but lose the link. */
  async deleteProvider(
    provider: TranscriptionProviderRecord,
    actor: ActivityActor
  ) {
    await this.transcriptionProvidersRepository.transaction(
      async (transaction) => {
        await this.transcriptionProvidersRepository.lockProvider(
          provider.organizationId,
          provider.id,
          transaction
        )

        if (
          (await this.transcriptionProvidersRepository.countLibrariesUsingProvider(
            provider.id,
            transaction
          )) > 0
        ) {
          throw new DomainError(VIDEO_CAPTION_ERRORS.PROVIDER_IN_USE)
        }

        await this.transcriptionProvidersRepository.deleteProvider(
          provider.id,
          transaction
        )
        await this.activityLogService.recordActivity(
          actor,
          {
            organizationId: provider.organizationId,
            action: ACTIVITY_ACTIONS.TRANSCRIPTION_PROVIDER_DELETED,
            resource: transcriptionProviderActivityResource(provider),
            before: toTranscriptionProviderActivityValues(provider),
          },
          transaction
        )
      }
    )

    return {}
  }

  /** Asks the saved provider for its models, which checks the address and the key without transcribing. */
  async testProvider(provider: TranscriptionProviderRecord) {
    const endpoint = this.toEndpoint(provider)

    if (!this.isEndpointAllowed(endpoint.baseUrl)) {
      return { connection: { isReachable: false, isAuthorized: false } }
    }

    return {
      connection: await this.transcriptionClient.testConnection(endpoint),
    }
  }

  /** Where and how to reach the provider, its key decrypted. */
  toEndpoint(provider: TranscriptionProviderRecord): TranscriptionEndpoint {
    return {
      baseUrl: provider.baseUrl ?? OPENAI_TRANSCRIPTION_DEFAULTS.BASE_URL,
      model: provider.model,
      apiKey: provider.apiKey
        ? this.storageSecretCipherService.decrypt(provider.apiKey)
        : null,
    }
  }

  /** Checked again before each transcription, as the config may have changed since the provider was saved. */
  isEndpointAllowed(baseUrl: string) {
    return isAllowedServiceEndpoint(baseUrl, {
      allowPrivateNetwork: this.config.TRANSCRIPTION_ALLOW_PRIVATE_ENDPOINTS,
    })
  }

  private async reloadProvider(organizationId: string, providerId: string) {
    const [provider, usedSeconds] = await Promise.all([
      this.transcriptionProvidersRepository.findProviderSummary(
        organizationId,
        providerId
      ),
      this.transcriptionProvidersRepository.sumAudioSecondsSince(
        providerId,
        startOfUtcMonth()
      ),
    ])

    if (!provider)
      throw new DomainError(VIDEO_CAPTION_ERRORS.PROVIDER_NOT_FOUND)

    return {
      provider: toTranscriptionProviderDto({
        ...provider,
        usedAudioSecondsThisMonth: usedSeconds,
      }),
    }
  }

  private assertEndpointAllowed(baseUrl: string) {
    if (!this.isEndpointAllowed(baseUrl)) {
      throw new DomainError(VIDEO_CAPTION_ERRORS.PROVIDER_ENDPOINT_NOT_ALLOWED)
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
