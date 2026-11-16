import {
  ACTIVITY_ACTIONS,
  DEFAULT_STORAGE_PATH_TEMPLATE,
} from "@workspace/shared"
import type { ActivityLogService } from "../../activity/services/activity-log.service"
import type { ActivityActor } from "../../activity/types/activity.types"
import { diffActivityValues } from "../../activity/utils/activity-changes.utils"
import { DomainError } from "../../common/errors/domain-error"
import type { DatabaseExecutor, Transaction } from "../../db/database.types"
import { toStorageDto } from "../../storage/dto/storages.dto.mappers"
import { STORAGE_ERRORS } from "../../storage/errors/storages.errors"
import type { StoragesService } from "../../storage/services/storages.service"
import type { StorageLocation } from "../../storage/types/storage.types"
import type {
  LibraryStorageSettingsDto,
  LibraryStorageUpdateBody,
} from "../dto/libraries.schemas"
import { LIBRARY_ERRORS } from "../errors/libraries.errors"
import type { LibrariesRepository } from "../repository/libraries.repository"
import type {
  LibraryProfile,
  ResolvedLibraryStorage,
} from "../types/libraries.types"
import { libraryActivityResource } from "../utils/library-activity.utils"
import { DEFAULT_STORAGE_REVISION } from "../constants/libraries.constants"

/**
 * Libraries keep videos in the default storage unless the owner assigns one
 * of the organization's storages. The assignment is fixed once a video file
 * of the library was written.
 */
export class LibraryStorageService {
  constructor(
    private readonly librariesRepository: LibrariesRepository,
    private readonly storagesService: StoragesService,
    private readonly activityLogService: ActivityLogService,
    private readonly defaultStorageLocation: StorageLocation
  ) {}

  async getStorageSettings(library: LibraryProfile) {
    const [storage, isLocked] = await Promise.all([
      library.storageId &&
        this.storagesService.findStorage(
          library.organizationId,
          library.storageId
        ),
      this.librariesRepository.hasStoredVideos(library.id),
    ])

    return {
      storage: {
        kind: library.storageKind,
        defaultPathTemplate: DEFAULT_STORAGE_PATH_TEMPLATE,
        custom: storage ? toStorageDto(storage) : null,
        isLocked,
      } satisfies LibraryStorageSettingsDto,
    }
  }

  /** Assigns one of the organization's storages to the library, or the default storage for null. */
  async assignStorage(
    library: LibraryProfile,
    actor: ActivityActor,
    input: LibraryStorageUpdateBody
  ) {
    await this.librariesRepository.transaction(async (transaction) => {
      await this.lockUnusedStorage(library.id, transaction)

      const storage = input.storageId
        ? await this.storagesService.lockStorageForAssignment(
            library.organizationId,
            input.storageId,
            transaction
          )
        : null

      if (input.storageId && !storage) {
        throw new DomainError(STORAGE_ERRORS.NOT_FOUND)
      }

      await this.librariesRepository.updateLibraryStorage(
        library.id,
        input.storageId,
        transaction
      )
      await this.activityLogService.recordActivity(
        actor,
        {
          organizationId: library.organizationId,
          action: ACTIVITY_ACTIONS.LIBRARY_STORAGE_CHANGED,
          resource: libraryActivityResource(library),
          ...diffActivityValues(
            { storageId: library.storageId, storageName: library.storageName },
            {
              storageId: storage?.id ?? null,
              storageName: storage?.name ?? null,
            }
          ),
        },
        transaction
      )
    })

    const updated = await this.librariesRepository.findLibrary(
      library.organizationId,
      library.id
    )

    if (!updated) throw new DomainError(LIBRARY_ERRORS.NOT_FOUND)

    return this.getStorageSettings(updated)
  }

  /** The storage location and path template videos of the library are written with. */
  async resolveLibraryStorage(
    libraryId: string,
    executor?: DatabaseExecutor
  ): Promise<ResolvedLibraryStorage> {
    const storage = await this.storagesService.findStorageOfLibrary(
      libraryId,
      executor
    )

    if (!storage) {
      return {
        location: this.defaultStorageLocation,
        pathTemplate: DEFAULT_STORAGE_PATH_TEMPLATE,
        revision: DEFAULT_STORAGE_REVISION,
      }
    }

    return {
      location: this.storagesService.toStorageLocation(storage),
      pathTemplate: storage.pathTemplate,
      revision: `${storage.id}:${storage.updatedAt.toISOString()}`,
    }
  }

  /** Takes the library lock and rejects changes once a video file was written to the current storage. */
  private async lockUnusedStorage(libraryId: string, transaction: Transaction) {
    await this.librariesRepository.lockLibrary(libraryId, transaction)

    if (
      await this.librariesRepository.hasStoredVideos(libraryId, transaction)
    ) {
      throw new DomainError(LIBRARY_ERRORS.STORAGE_LOCKED)
    }
  }
}
