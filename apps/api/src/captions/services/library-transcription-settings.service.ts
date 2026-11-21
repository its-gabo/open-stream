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
import { toLibraryTranscriptionSettingsDto } from "../dto/captions.dto.mappers"
import type { LibraryTranscriptionUpdateBody } from "../dto/captions.schemas"
import { VIDEO_CAPTION_ERRORS } from "../errors/captions.errors"
import type { TranscriptionProvidersRepository } from "../repository/transcription-providers.repository"
import type { VideoCaptionsRepository } from "../repository/video-captions.repository"
import { toLibraryTranscriptionActivityValues } from "../utils/caption-activity.utils"

/** Which of the organization's providers transcribes a library's videos, and whether it does so by itself. */
export class LibraryTranscriptionSettingsService {
  constructor(
    private readonly videoCaptionsRepository: VideoCaptionsRepository,
    private readonly transcriptionProvidersRepository: TranscriptionProvidersRepository,
    private readonly activityLogService: ActivityLogService
  ) {}

  async getLibraryTranscription(library: LibraryProfile) {
    const settings =
      await this.videoCaptionsRepository.findLibraryTranscription(library.id)

    if (!settings) throw new DomainError(LIBRARY_ERRORS.NOT_FOUND)

    return { transcription: toLibraryTranscriptionSettingsDto(settings) }
  }

  /** The provider must be the organization's; it is locked so it cannot be deleted meanwhile. */
  async updateLibraryTranscription(
    library: LibraryProfile,
    actor: ActivityActor,
    input: LibraryTranscriptionUpdateBody
  ) {
    const updated = await this.videoCaptionsRepository.transaction(
      async (transaction) => {
        const current =
          await this.videoCaptionsRepository.findLibraryTranscription(
            library.id,
            transaction
          )

        if (!current) throw new DomainError(LIBRARY_ERRORS.NOT_FOUND)

        if (
          input.providerId &&
          !(await this.transcriptionProvidersRepository.lockProvider(
            library.organizationId,
            input.providerId,
            transaction
          ))
        ) {
          throw new DomainError(VIDEO_CAPTION_ERRORS.PROVIDER_NOT_FOUND)
        }

        const changed =
          await this.videoCaptionsRepository.updateLibraryTranscription(
            library.id,
            input,
            transaction
          )

        if (!changed) throw new DomainError(LIBRARY_ERRORS.NOT_FOUND)

        const changes = diffActivityValues(
          toLibraryTranscriptionActivityValues(current),
          toLibraryTranscriptionActivityValues(changed)
        )

        if (changes) {
          await this.activityLogService.recordActivity(
            actor,
            {
              organizationId: library.organizationId,
              action: ACTIVITY_ACTIONS.LIBRARY_TRANSCRIPTION_UPDATED,
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

    return { transcription: toLibraryTranscriptionSettingsDto(updated) }
  }
}
