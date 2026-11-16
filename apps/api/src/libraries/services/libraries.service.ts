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
import type { OrganizationAccess } from "../../organizations/types/organizations.types"
import { toLibraryDto } from "../dto/libraries.dto.mappers"
import type {
  LibraryCreateBody,
  LibraryEncodingUpdateBody,
  LibraryUpdateBody,
} from "../dto/libraries.schemas"
import { LIBRARY_ERRORS } from "../errors/libraries.errors"
import type { LibrariesRepository } from "../repository/libraries.repository"
import type { LibrarySummary } from "../types/libraries.types"
import { libraryActivityResource } from "../utils/library-activity.utils"

export class LibrariesService {
  constructor(
    private readonly librariesRepository: LibrariesRepository,
    private readonly activityLogService: ActivityLogService
  ) {}

  findLibrary(organizationId: string, libraryId: string) {
    return this.librariesRepository.findLibrary(organizationId, libraryId)
  }

  async listLibraries(access: OrganizationAccess, query: PaginationQuery) {
    const filter = {
      organizationId: access.organization.id,
      search: query.search,
    }
    const [libraries, totalItems] = await Promise.all([
      this.librariesRepository.listLibraries(filter, toPageWindow(query)),
      this.librariesRepository.countLibraries(filter),
    ])

    return {
      libraries: libraries.map(toLibraryDto),
      pagination: toPaginationDto(query, totalItems),
    }
  }

  async createLibrary(
    access: OrganizationAccess,
    actor: ActivityActor,
    input: LibraryCreateBody
  ) {
    const { id } = await this.librariesRepository.insertLibrary({
      organizationId: access.organization.id,
      name: input.name,
    })

    await this.activityLogService.recordActivity(actor, {
      organizationId: access.organization.id,
      action: ACTIVITY_ACTIONS.LIBRARY_CREATED,
      resource: libraryActivityResource({ id, name: input.name }),
      after: { name: input.name },
    })

    return this.reloadLibrary(access.organization.id, id)
  }

  getLibrary(library: LibrarySummary) {
    return { library: toLibraryDto(library) }
  }

  async renameLibrary(
    library: LibrarySummary,
    actor: ActivityActor,
    input: LibraryUpdateBody
  ) {
    await this.librariesRepository.updateLibrary(library.id, input)
    await this.activityLogService.recordActivity(actor, {
      organizationId: library.organizationId,
      action: ACTIVITY_ACTIONS.LIBRARY_UPDATED,
      resource: libraryActivityResource({ id: library.id, name: input.name }),
      ...diffActivityValues({ name: library.name }, { name: input.name }),
    })

    return this.reloadLibrary(library.organizationId, library.id)
  }

  getEncodingSettings(library: LibrarySummary) {
    return { encoding: { transcodeQualities: library.transcodeQualities } }
  }

  /** Applies to videos uploaded from now on; reprocess earlier ones to change them. */
  async updateEncodingSettings(
    library: LibrarySummary,
    actor: ActivityActor,
    input: LibraryEncodingUpdateBody
  ) {
    await this.librariesRepository.updateTranscodeQualities(
      library.id,
      input.transcodeQualities
    )
    await this.activityLogService.recordActivity(actor, {
      organizationId: library.organizationId,
      action: ACTIVITY_ACTIONS.LIBRARY_ENCODING_UPDATED,
      resource: libraryActivityResource(library),
      ...diffActivityValues(
        { transcodeQualities: library.transcodeQualities },
        { transcodeQualities: input.transcodeQualities }
      ),
    })

    return { encoding: { transcodeQualities: input.transcodeQualities } }
  }

  private async reloadLibrary(organizationId: string, libraryId: string) {
    const library = await this.librariesRepository.findLibrary(
      organizationId,
      libraryId
    )

    if (!library) throw new DomainError(LIBRARY_ERRORS.NOT_FOUND)

    return { library: toLibraryDto(library) }
  }
}
