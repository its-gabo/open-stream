import { randomBytes } from "node:crypto"
import {
  ACTIVITY_ACTIONS,
  LIBRARY_API_KEY_LIMITS,
  ORGANIZATION_STATUSES,
  type LibraryApiKeyScope,
} from "@workspace/shared"
import type { ActivityLogService } from "../../activity/services/activity-log.service"
import type {
  ActivityActor,
  ActivityEntry,
} from "../../activity/types/activity.types"
import { diffActivityValues } from "../../activity/utils/activity-changes.utils"
import { DomainError } from "../../common/errors/domain-error"
import { API_BASE_PATH } from "../../common/http/http.constants"
import type { AppConfig } from "../../config/app.config"
import type { LibraryApiKeyRecord } from "../../db/schema"
import { ORGANIZATION_ERRORS } from "../../organizations/errors/organizations.errors"
import {
  LIBRARY_API_KEY_BYTES,
  LIBRARY_API_KEY_HINT_LENGTH,
  LIBRARY_API_KEY_PREFIX,
  LIBRARY_API_KEY_USE_RECORD_INTERVAL_MS,
  LIBRARY_API_PATH,
} from "../constants/library-api.constants"
import type {
  LibraryApiAccessDto,
  LibraryApiKeyCreateBody,
  LibraryApiKeyDto,
  LibraryApiKeyUpdateBody,
  LibrarySecurityUpdateBody,
} from "../dto/libraries.schemas"
import { LIBRARY_ERRORS } from "../errors/libraries.errors"
import type { LibrariesRepository } from "../repository/libraries.repository"
import type { LibraryApiKeysRepository } from "../repository/library-api-keys.repository"
import type {
  LibraryApiAuthentication,
  LibraryProfile,
} from "../types/libraries.types"
import {
  apiKeyActivityResource,
  libraryActivityContext,
  libraryActivityResource,
} from "../utils/library-activity.utils"
import { hashApiKey } from "../utils/library-api.utils"

/**
 * Access to a library through the library API: named keys, each limited to
 * its scopes, stored as hashes and shown only when created or rolled; and
 * the rules that decide which pages may play the library's videos.
 */
export class LibraryApiAccessService {
  constructor(
    private readonly librariesRepository: LibrariesRepository,
    private readonly libraryApiKeysRepository: LibraryApiKeysRepository,
    private readonly activityLogService: ActivityLogService,
    private readonly config: AppConfig
  ) {}

  async getApiAccess(library: LibraryProfile) {
    return { apiAccess: await this.loadApiAccess(library) }
  }

  /** The secret is returned only here and when the key is rolled. */
  async createApiKey(
    library: LibraryProfile,
    actor: ActivityActor,
    input: LibraryApiKeyCreateBody
  ) {
    const secret = this.generateSecret()
    const apiKey = await this.libraryApiKeysRepository.transaction(
      async (transaction) => {
        await this.librariesRepository.lockLibrary(library.id, transaction)

        if (
          (await this.libraryApiKeysRepository.countApiKeys(
            library.id,
            transaction
          )) >= LIBRARY_API_KEY_LIMITS.MAX_PER_LIBRARY
        ) {
          throw new DomainError(LIBRARY_ERRORS.API_KEY_LIMIT_REACHED)
        }

        const created = await this.libraryApiKeysRepository.insertApiKey(
          {
            libraryId: library.id,
            name: input.name,
            scopes: input.scopes,
            ...this.toStoredSecret(secret),
          },
          transaction
        )

        await this.activityLogService.recordActivity(
          actor,
          {
            organizationId: library.organizationId,
            action: ACTIVITY_ACTIONS.API_KEY_CREATED,
            resource: apiKeyActivityResource(created),
            after: { name: created.name, scopes: created.scopes },
            context: libraryActivityContext(library),
          },
          transaction
        )

        return created
      }
    )

    return { apiKey: this.toApiKeyDto(apiKey), secret }
  }

  async updateApiKey(
    library: LibraryProfile,
    actor: ActivityActor,
    apiKeyId: string,
    input: LibraryApiKeyUpdateBody
  ) {
    const apiKey = await this.findApiKey(library, apiKeyId)
    const updated = await this.libraryApiKeysRepository.updateApiKey(
      apiKey.id,
      input
    )

    if (!updated) throw new DomainError(LIBRARY_ERRORS.API_KEY_NOT_FOUND)

    await this.recordApiKeyActivity(library, actor, {
      action: ACTIVITY_ACTIONS.API_KEY_UPDATED,
      apiKey: updated,
      ...diffActivityValues(
        { name: apiKey.name, scopes: apiKey.scopes },
        { name: updated.name, scopes: updated.scopes }
      ),
    })

    return { apiKey: this.toApiKeyDto(updated) }
  }

  /** Replaces the key's secret, keeping its name and scopes; the old secret and its playback URLs stop working. */
  async rollApiKey(
    library: LibraryProfile,
    actor: ActivityActor,
    apiKeyId: string
  ) {
    const apiKey = await this.findApiKey(library, apiKeyId)
    const secret = this.generateSecret()
    const updated = await this.libraryApiKeysRepository.updateApiKey(
      apiKey.id,
      { ...this.toStoredSecret(secret), lastUsedAt: null }
    )

    if (!updated) throw new DomainError(LIBRARY_ERRORS.API_KEY_NOT_FOUND)

    await this.recordApiKeyActivity(library, actor, {
      action: ACTIVITY_ACTIONS.API_KEY_ROLLED,
      apiKey: updated,
    })

    return { apiKey: this.toApiKeyDto(updated), secret }
  }

  async deleteApiKey(
    library: LibraryProfile,
    actor: ActivityActor,
    apiKeyId: string
  ) {
    const apiKey = await this.findApiKey(library, apiKeyId)

    await this.libraryApiKeysRepository.deleteApiKey(apiKey.id)
    await this.recordApiKeyActivity(library, actor, {
      action: ACTIVITY_ACTIONS.API_KEY_DELETED,
      apiKey,
      before: { name: apiKey.name, scopes: apiKey.scopes },
    })

    return {}
  }

  async updateSecurity(
    library: LibraryProfile,
    actor: ActivityActor,
    input: LibrarySecurityUpdateBody
  ) {
    await this.librariesRepository.updatePlaybackSecurity(library.id, input)
    await this.activityLogService.recordActivity(actor, {
      organizationId: library.organizationId,
      action: ACTIVITY_ACTIONS.LIBRARY_SECURITY_UPDATED,
      resource: libraryActivityResource(library),
      ...diffActivityValues(
        {
          allowedPlaybackHosts: library.allowedPlaybackHosts,
          requireSignedPlayback: library.requireSignedPlayback,
        },
        input
      ),
    })

    const updated = await this.librariesRepository.findLibrary(
      library.organizationId,
      library.id
    )

    if (!updated) throw new DomainError(LIBRARY_ERRORS.NOT_FOUND)

    return { apiAccess: await this.loadApiAccess(updated) }
  }

  /**
   * The library and key a request authenticates with. A missing library and
   * a wrong key are reported alike, so library ids cannot be probed; a valid
   * key without `requiredScope` is refused.
   */
  async authenticateLibrary(
    libraryId: string,
    secret: string | null,
    requiredScope: LibraryApiKeyScope
  ): Promise<LibraryApiAuthentication> {
    const apiKey = secret
      ? await this.libraryApiKeysRepository.findApiKeyByHash(hashApiKey(secret))
      : null
    const library =
      apiKey?.libraryId === libraryId
        ? await this.librariesRepository.findPublicLibrary(libraryId)
        : null

    if (!apiKey || !library) {
      throw new DomainError(LIBRARY_ERRORS.API_KEY_INVALID)
    }

    if (library.organizationStatus !== ORGANIZATION_STATUSES.ACTIVE) {
      throw new DomainError(ORGANIZATION_ERRORS.PENDING_DELETION)
    }

    if (!apiKey.scopes.includes(requiredScope)) {
      throw new DomainError(LIBRARY_ERRORS.API_KEY_SCOPE_MISSING)
    }

    const now = new Date()

    await this.libraryApiKeysRepository.recordApiKeyUse(
      apiKey.id,
      now,
      new Date(now.getTime() - LIBRARY_API_KEY_USE_RECORD_INTERVAL_MS)
    )

    return { library, apiKey }
  }

  private async recordApiKeyActivity(
    library: LibraryProfile,
    actor: ActivityActor,
    {
      action,
      apiKey,
      ...changes
    }: Pick<ActivityEntry, "action" | "before" | "after"> & {
      apiKey: LibraryApiKeyRecord
    }
  ) {
    await this.activityLogService.recordActivity(actor, {
      organizationId: library.organizationId,
      action,
      resource: apiKeyActivityResource(apiKey),
      context: libraryActivityContext(library),
      ...changes,
    })
  }

  private async findApiKey(library: LibraryProfile, apiKeyId: string) {
    const apiKey = await this.libraryApiKeysRepository.findApiKey(
      library.id,
      apiKeyId
    )

    if (!apiKey) throw new DomainError(LIBRARY_ERRORS.API_KEY_NOT_FOUND)

    return apiKey
  }

  private async loadApiAccess(
    library: LibraryProfile
  ): Promise<LibraryApiAccessDto> {
    const apiKeys = await this.libraryApiKeysRepository.listApiKeys(library.id)

    return {
      libraryId: library.id,
      apiUrl: `${this.config.WEB_ORIGIN}${API_BASE_PATH}${LIBRARY_API_PATH}/${library.id}`,
      apiKeys: apiKeys.map((apiKey) => this.toApiKeyDto(apiKey)),
      security: {
        allowedPlaybackHosts: library.allowedPlaybackHosts,
        requireSignedPlayback: library.requireSignedPlayback,
      },
    }
  }

  private generateSecret() {
    return `${LIBRARY_API_KEY_PREFIX}${randomBytes(LIBRARY_API_KEY_BYTES).toString("base64url")}`
  }

  private toStoredSecret(secret: string) {
    return {
      keyHash: hashApiKey(secret),
      keyHint: secret.slice(-LIBRARY_API_KEY_HINT_LENGTH),
    }
  }

  private toApiKeyDto(apiKey: LibraryApiKeyRecord): LibraryApiKeyDto {
    return {
      id: apiKey.id,
      name: apiKey.name,
      hint: apiKey.keyHint,
      scopes: apiKey.scopes,
      createdAt: apiKey.createdAt.toISOString(),
      lastUsedAt: apiKey.lastUsedAt?.toISOString() ?? null,
    }
  }
}
