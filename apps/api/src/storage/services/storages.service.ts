import type { Logger } from "../../common/logging/logger"
import { toError } from "../../common/utils/error.utils"
import { ACTIVITY_ACTIONS } from "@workspace/shared"
import type { ActivityLogService } from "../../activity/services/activity-log.service"
import type { ActivityActor } from "../../activity/types/activity.types"
import { diffActivityValues } from "../../activity/utils/activity-changes.utils"
import { DomainError } from "../../common/errors/domain-error"
import type { PaginationQuery } from "../../common/http/pagination/pagination.schemas"
import {
  toPageWindow,
  toPaginationDto,
} from "../../common/http/pagination/pagination.utils"
import type { AppConfig } from "../../config/app.config"
import type { DatabaseExecutor, Transaction } from "../../db/database.types"
import type { StorageRecord } from "../../db/schema"
import type { OrganizationAccess } from "../../organizations/types/organizations.types"
import {
  STORAGE_LOCK_STRENGTHS,
  ACCESS_KEY_ID_HINT_LENGTH,
} from "../constants/storage.constants"
import { toStorageDto } from "../dto/storages.dto.mappers"
import type {
  StorageConnectionTestBody,
  StorageCreateBody,
  StorageUpdateBody,
} from "../dto/storages.schemas"
import { STORAGE_ERRORS } from "../errors/storages.errors"
import type { StoragesRepository } from "../repository/storages.repository"
import { storageCredentialsSchema } from "../schemas/storage.schemas"
import type {
  ObjectStorage,
  StorageCredentials,
  StorageLocation,
  StorageLocationSnapshot,
  StorageSummary,
} from "../types/storage.types"
import { isAllowedStorageEndpoint } from "../utils/storage-endpoint.utils"
import type { StorageSecretCipherService } from "./storage-secret-cipher.service"
import {
  storageActivityResource,
  toStorageActivityValues,
} from "../utils/storage-activity.utils"

/**
 * S3-compatible buckets an organization connects once and assigns to any of
 * its libraries. Credentials are stored encrypted and never returned. Once a
 * video file was written to a storage, its bucket and path template are fixed;
 * its name and credentials can still change.
 */
export class StoragesService {
  constructor(
    private readonly storagesRepository: StoragesRepository,
    private readonly objectStorage: ObjectStorage,
    private readonly storageSecretCipherService: StorageSecretCipherService,
    private readonly activityLogService: ActivityLogService,
    private readonly logger: Logger,
    private readonly config: AppConfig
  ) {}

  findStorage(organizationId: string, storageId: string) {
    return this.storagesRepository.findStorage(organizationId, storageId)
  }

  findStorageOfLibrary(libraryId: string, executor?: DatabaseExecutor) {
    return this.storagesRepository.findStorageOfLibrary(libraryId, executor)
  }

  /** Keeps the storage from changing or being deleted while it is assigned in the transaction. */
  lockStorageForAssignment(
    organizationId: string,
    storageId: string,
    transaction: Transaction
  ) {
    return this.storagesRepository.lockStorage(
      organizationId,
      storageId,
      STORAGE_LOCK_STRENGTHS.KEEP,
      transaction
    )
  }

  async listStorages(access: OrganizationAccess, query: PaginationQuery) {
    const filter = {
      organizationId: access.organization.id,
      search: query.search,
    }
    const [storages, totalItems] = await Promise.all([
      this.storagesRepository.listStorages(filter, toPageWindow(query)),
      this.storagesRepository.countStorages(filter),
    ])

    return {
      storages: storages.map(toStorageDto),
      pagination: toPaginationDto(query, totalItems),
    }
  }

  getStorage(storage: StorageSummary) {
    return { storage: toStorageDto(storage) }
  }

  /** Saves a storage after checking the bucket is reachable with the given credentials. */
  async createStorage(
    access: OrganizationAccess,
    actor: ActivityActor,
    input: StorageCreateBody
  ) {
    const credentials = {
      accessKeyId: input.accessKeyId,
      secretAccessKey: input.secretAccessKey,
    }

    await this.assertBucketReachable({ ...input, credentials })

    const encrypted = this.encryptCredentials(credentials)
    const { id } = await this.storagesRepository.insertStorage({
      organizationId: access.organization.id,
      name: input.name,
      endpoint: input.endpoint,
      region: input.region,
      bucket: input.bucket,
      forcePathStyle: input.forcePathStyle,
      pathTemplate: input.pathTemplate,
      ...encrypted,
    })

    await this.activityLogService.recordActivity(actor, {
      organizationId: access.organization.id,
      action: ACTIVITY_ACTIONS.STORAGE_CREATED,
      resource: storageActivityResource({ id, name: input.name }),
      after: toStorageActivityValues({ ...input, ...encrypted }),
    })

    return this.reloadStorage(access.organization.id, id)
  }

  /** Re-checks the bucket whenever the connection or the credentials change. */
  async updateStorage(
    storage: StorageSummary,
    actor: ActivityActor,
    input: StorageUpdateBody
  ) {
    const newCredentials =
      input.accessKeyId && input.secretAccessKey
        ? {
            accessKeyId: input.accessKeyId,
            secretAccessKey: input.secretAccessKey,
          }
        : null
    const changesLayout =
      input.endpoint !== storage.endpoint ||
      input.region !== storage.region ||
      input.bucket !== storage.bucket ||
      input.forcePathStyle !== storage.forcePathStyle ||
      input.pathTemplate !== storage.pathTemplate

    if (changesLayout || newCredentials) {
      await this.assertBucketReachable({
        endpoint: input.endpoint,
        region: input.region,
        bucket: input.bucket,
        forcePathStyle: input.forcePathStyle,
        credentials:
          newCredentials ?? this.toStorageLocation(storage).credentials,
      })
    }

    await this.storagesRepository.transaction(async (transaction) => {
      const locked = await this.storagesRepository.lockStorage(
        storage.organizationId,
        storage.id,
        STORAGE_LOCK_STRENGTHS.CHANGE,
        transaction
      )

      if (!locked) throw new DomainError(STORAGE_ERRORS.NOT_FOUND)

      if (
        changesLayout &&
        (await this.storagesRepository.hasStoredVideos(storage.id, transaction))
      ) {
        throw new DomainError(STORAGE_ERRORS.LOCKED)
      }

      const updated = await this.storagesRepository.updateStorage(
        storage.id,
        {
          name: input.name,
          endpoint: input.endpoint,
          region: input.region,
          bucket: input.bucket,
          forcePathStyle: input.forcePathStyle,
          pathTemplate: input.pathTemplate,
          ...(newCredentials && this.encryptCredentials(newCredentials)),
        },
        transaction
      )

      await this.activityLogService.recordActivity(
        actor,
        {
          organizationId: storage.organizationId,
          action: ACTIVITY_ACTIONS.STORAGE_UPDATED,
          resource: storageActivityResource({
            id: storage.id,
            name: input.name,
          }),
          ...diffActivityValues(
            toStorageActivityValues(storage),
            toStorageActivityValues(updated ?? storage)
          ),
          context: { credentialsChanged: Boolean(newCredentials) },
        },
        transaction
      )
    })

    return this.reloadStorage(storage.organizationId, storage.id)
  }

  async deleteStorage(storage: StorageSummary, actor: ActivityActor) {
    await this.storagesRepository.transaction(async (transaction) => {
      await this.storagesRepository.lockStorage(
        storage.organizationId,
        storage.id,
        STORAGE_LOCK_STRENGTHS.CHANGE,
        transaction
      )

      if (
        (await this.storagesRepository.countLibrariesOfStorage(
          storage.id,
          transaction
        )) > 0
      ) {
        throw new DomainError(STORAGE_ERRORS.IN_USE)
      }

      await this.storagesRepository.deleteStorage(storage.id, transaction)
      await this.activityLogService.recordActivity(
        actor,
        {
          organizationId: storage.organizationId,
          action: ACTIVITY_ACTIONS.STORAGE_DELETED,
          resource: storageActivityResource(storage),
          before: toStorageActivityValues(storage),
        },
        transaction
      )
    })

    return {}
  }

  /** Checks unsaved settings; an endpoint that is not allowed is rejected rather than probed. */
  async testConnection(input: StorageConnectionTestBody) {
    this.assertEndpointAllowed(input.endpoint)

    return this.toConnectionTest({
      endpoint: input.endpoint,
      region: input.region,
      bucket: input.bucket,
      forcePathStyle: input.forcePathStyle,
      credentials: {
        accessKeyId: input.accessKeyId,
        secretAccessKey: input.secretAccessKey,
      },
    })
  }

  testSavedStorage(storage: StorageSummary) {
    return this.toConnectionTest(this.toStorageLocation(storage))
  }

  toStorageLocation(storage: StorageRecord): StorageLocation {
    return this.openLocationSnapshot(this.snapshotLocation(storage))
  }

  /** The storage's connection with its credentials still encrypted, to keep for work done after the storage may be gone. */
  snapshotLocation(storage: StorageRecord): StorageLocationSnapshot {
    return {
      endpoint: storage.endpoint,
      region: storage.region,
      bucket: storage.bucket,
      forcePathStyle: storage.forcePathStyle,
      credentials: {
        ciphertext: storage.credentialsCiphertext,
        iv: storage.credentialsIv,
        tag: storage.credentialsTag,
        encryptedKey: storage.credentialsEncryptedKey,
        keyIv: storage.credentialsKeyIv,
        keyTag: storage.credentialsKeyTag,
      },
    }
  }

  openLocationSnapshot(snapshot: StorageLocationSnapshot): StorageLocation {
    return {
      ...snapshot,
      credentials: storageCredentialsSchema.parse(
        JSON.parse(
          this.storageSecretCipherService.decrypt(snapshot.credentials)
        )
      ),
    }
  }

  private async reloadStorage(organizationId: string, storageId: string) {
    const storage = await this.storagesRepository.findStorage(
      organizationId,
      storageId
    )

    if (!storage) throw new DomainError(STORAGE_ERRORS.NOT_FOUND)

    return { storage: toStorageDto(storage) }
  }

  private async toConnectionTest(location: StorageLocation) {
    return {
      connection: { isReachable: await this.isBucketReachable(location) },
    }
  }

  private assertEndpointAllowed(endpoint: string) {
    if (
      !isAllowedStorageEndpoint(endpoint, {
        allowPrivateNetwork: this.config.STORAGE_ALLOW_PRIVATE_ENDPOINTS,
      })
    ) {
      throw new DomainError(STORAGE_ERRORS.ENDPOINT_NOT_ALLOWED)
    }
  }

  private async assertBucketReachable(location: StorageLocation) {
    this.assertEndpointAllowed(location.endpoint)

    if (!(await this.isBucketReachable(location))) {
      throw new DomainError(STORAGE_ERRORS.UNREACHABLE)
    }
  }

  private async isBucketReachable(location: StorageLocation) {
    try {
      await this.objectStorage.checkBucketAccess(location)

      return true
    } catch (error) {
      this.logger.warn("Storage bucket check failed", {
        bucket: location.bucket,
        error: toError(error),
      })

      return false
    }
  }

  private encryptCredentials(credentials: StorageCredentials) {
    const encrypted = this.storageSecretCipherService.encrypt(
      JSON.stringify(credentials)
    )

    return {
      accessKeyIdHint: credentials.accessKeyId.slice(
        -ACCESS_KEY_ID_HINT_LENGTH
      ),
      credentialsCiphertext: encrypted.ciphertext,
      credentialsIv: encrypted.iv,
      credentialsTag: encrypted.tag,
      credentialsEncryptedKey: encrypted.encryptedKey,
      credentialsKeyIv: encrypted.keyIv,
      credentialsKeyTag: encrypted.keyTag,
    }
  }
}
