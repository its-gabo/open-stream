import { ACTIVITY_ACTIONS } from "@workspace/shared"
import type { ActivityLogService } from "../../activity/services/activity-log.service"
import type { ActivityActor } from "../../activity/types/activity.types"
import { diffActivityValues } from "../../activity/utils/activity-changes.utils"
import { DomainError } from "../../common/errors/domain-error"
import { LIBRARY_ERRORS } from "../../libraries/errors/libraries.errors"
import type { LibraryProfile } from "../../libraries/types/libraries.types"
import {
  libraryActivityContext,
  libraryActivityResource,
} from "../../libraries/utils/library-activity.utils"
import { toLibraryChapterGenerationSettingsDto } from "../dto/chapter-generation.dto.mappers"
import type { LibraryChapterGenerationUpdateBody } from "../dto/chapter-generation.schemas"
import { CHAPTER_GENERATION_ERRORS } from "../errors/chapter-generation.errors"
import type { ChapterGenerationProvidersRepository } from "../repository/chapter-generation-providers.repository"
import { toLibraryChapterGenerationActivityValues } from "../utils/chapter-generation-activity.utils"

/** Which of the organization's providers writes chapters for a library's videos. */
export class LibraryChapterGenerationSettingsService {
  constructor(
    private readonly chapterGenerationProvidersRepository: ChapterGenerationProvidersRepository,
    private readonly activityLogService: ActivityLogService
  ) {}

  async getLibraryChapterGeneration(library: LibraryProfile) {
    const settings =
      await this.chapterGenerationProvidersRepository.findLibraryChapterGeneration(
        library.id
      )

    if (!settings) throw new DomainError(LIBRARY_ERRORS.NOT_FOUND)

    return {
      chapterGeneration: toLibraryChapterGenerationSettingsDto(settings),
    }
  }

  /** The provider must be the organization's; it is locked so it cannot be deleted meanwhile. */
  async updateLibraryChapterGeneration(
    library: LibraryProfile,
    actor: ActivityActor,
    input: LibraryChapterGenerationUpdateBody
  ) {
    const updated = await this.chapterGenerationProvidersRepository.transaction(
      async (transaction) => {
        const current =
          await this.chapterGenerationProvidersRepository.findLibraryChapterGeneration(
            library.id,
            transaction
          )

        if (!current) throw new DomainError(LIBRARY_ERRORS.NOT_FOUND)

        if (
          input.providerId &&
          !(await this.chapterGenerationProvidersRepository.lockProvider(
            library.organizationId,
            input.providerId,
            transaction
          ))
        ) {
          throw new DomainError(CHAPTER_GENERATION_ERRORS.PROVIDER_NOT_FOUND)
        }

        const changed =
          await this.chapterGenerationProvidersRepository.updateLibraryChapterGeneration(
            library.id,
            input,
            transaction
          )

        if (!changed) throw new DomainError(LIBRARY_ERRORS.NOT_FOUND)

        const changes = diffActivityValues(
          toLibraryChapterGenerationActivityValues(current),
          toLibraryChapterGenerationActivityValues(changed)
        )

        if (changes) {
          await this.activityLogService.recordActivity(
            actor,
            {
              organizationId: library.organizationId,
              action: ACTIVITY_ACTIONS.LIBRARY_CHAPTER_GENERATION_UPDATED,
              resource: libraryActivityResource(library),
              context: libraryActivityContext(library),
              ...changes,
            },
            transaction
          )
        }

        return changed
      }
    )

    return { chapterGeneration: toLibraryChapterGenerationSettingsDto(updated) }
  }
}
