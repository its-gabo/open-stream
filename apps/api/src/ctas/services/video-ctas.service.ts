import {
  ACTIVITY_ACTIONS,
  VIDEO_CTA_LIMITS,
  VIDEO_CTA_PLACEMENTS,
  VIDEO_PROCESSING_STATUSES,
} from "@workspace/shared"
import type { ActivityLogService } from "../../activity/services/activity-log.service"
import type {
  ActivityActor,
  ActivityEntry,
} from "../../activity/types/activity.types"
import { diffActivityValues } from "../../activity/utils/activity-changes.utils"
import { DomainError } from "../../common/errors/domain-error"
import type { Transaction } from "../../db/database.types"
import type { VideoCtaRecord, VideoRecord } from "../../db/schema"
import { LIBRARY_ERRORS } from "../../libraries/errors/libraries.errors"
import type { LibraryProfile } from "../../libraries/types/libraries.types"
import {
  libraryActivityContext,
  videoActivityResource,
} from "../../libraries/utils/library-activity.utils"
import { toVideoCtaDto } from "../dto/ctas.dto.mappers"
import type { VideoCtaBody } from "../dto/ctas.schemas"
import { VIDEO_CTA_ERRORS } from "../errors/ctas.errors"
import type { VideoCtasRepository } from "../repository/video-ctas.repository"
import { toVideoCtaActivityValues } from "../utils/cta-activity.utils"

/** A video's calls to action, managed by its organization's members or with the library's API key. */
export class VideoCtasService {
  constructor(
    private readonly videoCtasRepository: VideoCtasRepository,
    private readonly activityLogService: ActivityLogService
  ) {}

  /** In playback order: overlays by when they appear, then the end screen. */
  async listVideoCtas(library: LibraryProfile, videoId: string) {
    const scope = {
      organizationId: library.organizationId,
      libraryId: library.id,
      videoId,
    }
    const video = await this.videoCtasRepository.findVideo(scope)

    if (!video) throw new DomainError(LIBRARY_ERRORS.VIDEO_NOT_FOUND)

    const ctas = await this.videoCtasRepository.listVideoCtas(scope)

    return { ctas: ctas.map(toVideoCtaDto) }
  }

  /** Adds a call to action to a processed video, whose duration its times must fit. */
  async createVideoCta(
    library: LibraryProfile,
    actor: ActivityActor,
    videoId: string,
    input: VideoCtaBody
  ) {
    const created = await this.videoCtasRepository.transaction(
      async (transaction) => {
        const video = await this.lockVideo(library, videoId, transaction)

        if (
          (await this.videoCtasRepository.countVideoCtas(
            video.id,
            transaction
          )) >= VIDEO_CTA_LIMITS.MAX_PER_VIDEO
        ) {
          throw new DomainError(VIDEO_CTA_ERRORS.LIMIT_REACHED)
        }

        await this.assertCtaFitsVideo(video, input, null, transaction)

        const cta = await this.videoCtasRepository.insertVideoCta(
          {
            organizationId: library.organizationId,
            libraryId: library.id,
            videoId: video.id,
            ...input,
            createdById: actor.userId,
          },
          transaction
        )

        await this.recordCtaChange(
          library,
          actor,
          {
            action: ACTIVITY_ACTIONS.VIDEO_CTA_CREATED,
            video,
            cta,
            after: toVideoCtaActivityValues(cta),
          },
          transaction
        )

        return cta
      }
    )

    return { cta: toVideoCtaDto(created) }
  }

  /**
   * Replaces all of a call to action's fields; its views and leads stay with
   * it. Saving the same fields again changes and records nothing.
   */
  async updateVideoCta(
    library: LibraryProfile,
    actor: ActivityActor,
    { videoId, ctaId }: { videoId: string; ctaId: string },
    input: VideoCtaBody
  ) {
    const updated = await this.videoCtasRepository.transaction(
      async (transaction) => {
        const video = await this.lockVideo(library, videoId, transaction)
        const cta = await this.findCtaForUpdate(video, ctaId, transaction)
        const changes = diffActivityValues(toVideoCtaActivityValues(cta), {
          ...toVideoCtaActivityValues(cta),
          ...input,
        })

        if (!changes) return cta

        await this.assertCtaFitsVideo(video, input, cta.id, transaction)

        const changed = await this.videoCtasRepository.updateVideoCta(
          cta.id,
          input,
          transaction
        )

        if (!changed) throw new DomainError(VIDEO_CTA_ERRORS.NOT_FOUND)

        await this.recordCtaChange(
          library,
          actor,
          {
            action: ACTIVITY_ACTIONS.VIDEO_CTA_UPDATED,
            video,
            cta: changed,
            ...changes,
          },
          transaction
        )

        return changed
      }
    )

    return { cta: toVideoCtaDto(updated) }
  }

  /** Its view counts go with it; leads left in it stay, keeping its heading. */
  async deleteVideoCta(
    library: LibraryProfile,
    actor: ActivityActor,
    { videoId, ctaId }: { videoId: string; ctaId: string }
  ) {
    await this.videoCtasRepository.transaction(async (transaction) => {
      const video = await this.lockVideo(library, videoId, transaction)
      const cta = await this.findCtaForUpdate(video, ctaId, transaction)

      await this.videoCtasRepository.deleteVideoCta(cta.id, transaction)
      await this.recordCtaChange(
        library,
        actor,
        {
          action: ACTIVITY_ACTIONS.VIDEO_CTA_DELETED,
          video,
          cta,
          before: toVideoCtaActivityValues(cta),
        },
        transaction
      )
    })
  }

  private async lockVideo(
    library: LibraryProfile,
    videoId: string,
    transaction: Transaction
  ) {
    const video = await this.videoCtasRepository.lockVideo(
      {
        organizationId: library.organizationId,
        libraryId: library.id,
        videoId,
      },
      transaction
    )

    if (!video) throw new DomainError(LIBRARY_ERRORS.VIDEO_NOT_FOUND)

    return video
  }

  private async findCtaForUpdate(
    video: VideoRecord,
    ctaId: string,
    transaction: Transaction
  ) {
    const cta = await this.videoCtasRepository.findVideoCtaForUpdate(
      {
        organizationId: video.organizationId,
        libraryId: video.libraryId,
        videoId: video.id,
        ctaId,
      },
      transaction
    )

    if (!cta) throw new DomainError(VIDEO_CTA_ERRORS.NOT_FOUND)

    return cta
  }

  /**
   * Only a processed video's duration tells whether an overlay's times fit
   * it; a video has one end screen at most, which `ctaId` may already be.
   */
  private async assertCtaFitsVideo(
    video: VideoRecord,
    input: VideoCtaBody,
    ctaId: string | null,
    transaction: Transaction
  ) {
    if (
      video.processingStatus !== VIDEO_PROCESSING_STATUSES.READY ||
      video.durationSeconds === null
    ) {
      throw new DomainError(LIBRARY_ERRORS.VIDEO_NOT_READY)
    }

    if (input.placement === VIDEO_CTA_PLACEMENTS.END_SCREEN) {
      const endScreenId = await this.videoCtasRepository.findEndScreenId(
        video.id,
        transaction
      )

      if (endScreenId && endScreenId !== ctaId) {
        throw new DomainError(VIDEO_CTA_ERRORS.END_SCREEN_TAKEN)
      }

      return
    }

    const latestStart =
      video.durationSeconds - VIDEO_CTA_LIMITS.MIN_LENGTH_SECONDS

    if (
      (input.startSeconds ?? 0) > latestStart ||
      (input.endSeconds ?? 0) > video.durationSeconds
    ) {
      throw new DomainError(VIDEO_CTA_ERRORS.OUT_OF_RANGE)
    }
  }

  private async recordCtaChange(
    library: LibraryProfile,
    actor: ActivityActor,
    {
      action,
      video,
      cta,
      ...changes
    }: Pick<ActivityEntry, "action" | "before" | "after"> & {
      video: VideoRecord
      cta: VideoCtaRecord
    },
    transaction: Transaction
  ) {
    await this.activityLogService.recordActivity(
      actor,
      {
        organizationId: library.organizationId,
        action,
        resource: videoActivityResource(video),
        context: { ...libraryActivityContext(library), ctaId: cta.id },
        ...changes,
      },
      transaction
    )
  }
}
