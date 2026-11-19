import {
  ACTIVITY_ACTIONS,
  WEBHOOK_EVENT_TYPES,
  videoTitleFromFileName,
  type WebhookEventType,
} from "@workspace/shared"
import type { ActivityLogService } from "../../activity/services/activity-log.service"
import type {
  ActivityActor,
  ActivityEntry,
} from "../../activity/types/activity.types"
import { diffActivityValues } from "../../activity/utils/activity-changes.utils"
import { DomainError } from "../../common/errors/domain-error"
import type { PaginationQuery } from "../../common/http/pagination/pagination.schemas"
import {
  toPageWindow,
  toPaginationDto,
} from "../../common/http/pagination/pagination.utils"
import {
  toVideoDto,
  toVideoStatusDetailsDto,
} from "../dto/libraries.dto.mappers"
import type { VideoCreateBody, VideoUpdateBody } from "../dto/libraries.schemas"
import { LIBRARY_ERRORS } from "../errors/libraries.errors"
import type { VideosRepository } from "../repository/videos.repository"
import type { LibraryProfile } from "../types/libraries.types"
import type { Transaction } from "../../db/database.types"
import type { VideoRecord } from "../../db/schema"
import type { WebhookEventsService } from "../../webhooks/services/webhook-events.service"
import { toVideoWebhookEvent } from "../utils/video-events.utils"
import {
  libraryActivityContext,
  toVideoActivityValues,
  videoActivityResource,
} from "../utils/library-activity.utils"
import type { VideoFilesCleanupService } from "./video-files-cleanup.service"

export class VideosService {
  constructor(
    private readonly videosRepository: VideosRepository,
    private readonly videoFilesCleanupService: VideoFilesCleanupService,
    private readonly webhookEventsService: WebhookEventsService,
    private readonly activityLogService: ActivityLogService
  ) {}

  async listVideos(library: LibraryProfile) {
    const videos = await this.videosRepository.listVideos(
      library.organizationId,
      library.id
    )

    return {
      videos: videos.map(({ video, importUrl }) =>
        toVideoDto(video, importUrl)
      ),
    }
  }

  async listVideoPage(library: LibraryProfile, query: PaginationQuery) {
    const filter = {
      organizationId: library.organizationId,
      libraryId: library.id,
      search: query.search,
    }
    const [videos, totalItems] = await Promise.all([
      this.videosRepository.listVideoPage(filter, toPageWindow(query)),
      this.videosRepository.countVideos(filter),
    ])

    return {
      videos: videos.map(({ video, importUrl }) =>
        toVideoDto(video, importUrl)
      ),
      pagination: toPaginationDto(query, totalItems),
    }
  }

  /** Creates a draft video, named by its title or else by the file it is created for. */
  async createVideo(
    library: LibraryProfile,
    actor: ActivityActor,
    input: VideoCreateBody
  ) {
    const video = await this.videosRepository.transaction(
      async (transaction) => {
        const created = await this.videosRepository.insertVideo(
          {
            organizationId: library.organizationId,
            libraryId: library.id,
            title: input.title ?? videoTitleFromFileName(input.fileName ?? ""),
            createdById: actor.userId,
          },
          transaction
        )

        await this.recordVideoChange(
          library,
          actor,
          {
            eventType: WEBHOOK_EVENT_TYPES.VIDEO_CREATED,
            action: ACTIVITY_ACTIONS.VIDEO_CREATED,
            video: created,
            after: { title: created.title },
          },
          transaction
        )

        return created
      }
    )

    return { video: toVideoDto(video, null) }
  }

  async getVideo(library: LibraryProfile, videoId: string) {
    const video = await this.findVideo(library, videoId)

    return { video: await this.toVideoDtoWithImport(video) }
  }

  /** Upload and processing state only; also what `video.processing.*` webhook events carry. */
  async getVideoStatus(library: LibraryProfile, videoId: string) {
    return {
      status: toVideoStatusDetailsDto(await this.findVideo(library, videoId)),
    }
  }

  async renameVideo(
    library: LibraryProfile,
    actor: ActivityActor,
    videoId: string,
    input: VideoUpdateBody
  ) {
    const video = await this.findVideo(library, videoId)
    const renamed = await this.videosRepository.transaction(
      async (transaction) => {
        const updated = await this.videosRepository.updateVideo(
          video.id,
          { title: input.title },
          transaction
        )

        if (!updated) throw new DomainError(LIBRARY_ERRORS.VIDEO_NOT_FOUND)

        await this.recordVideoChange(
          library,
          actor,
          {
            eventType: WEBHOOK_EVENT_TYPES.VIDEO_UPDATED,
            action: ACTIVITY_ACTIONS.VIDEO_UPDATED,
            video: updated,
            ...diffActivityValues(
              { title: video.title },
              { title: updated.title }
            ),
          },
          transaction
        )

        return updated
      }
    )

    return { video: await this.toVideoDtoWithImport(renamed) }
  }

  /**
   * Deletes the video right away; its files, processed outputs and any
   * unfinished upload are removed from storage by the worker afterwards.
   */
  async deleteVideo(
    library: LibraryProfile,
    actor: ActivityActor,
    videoId: string
  ) {
    await this.videosRepository.transaction(async (transaction) => {
      const video = await this.videosRepository.lockVideo(
        {
          organizationId: library.organizationId,
          libraryId: library.id,
          videoId,
        },
        transaction
      )

      if (!video) throw new DomainError(LIBRARY_ERRORS.VIDEO_NOT_FOUND)

      await this.videoFilesCleanupService.scheduleVideoFilesRemoval(
        video,
        transaction
      )
      await this.videosRepository.deleteVideo(video.id, transaction)
      await this.recordVideoChange(
        library,
        actor,
        {
          eventType: WEBHOOK_EVENT_TYPES.VIDEO_DELETED,
          action: ACTIVITY_ACTIONS.VIDEO_DELETED,
          video,
          before: toVideoActivityValues(video),
        },
        transaction
      )
    })
  }

  /** Tells the webhook and records the activity, in the transaction of the change. */
  private async recordVideoChange(
    library: LibraryProfile,
    actor: ActivityActor,
    {
      eventType,
      action,
      video,
      ...changes
    }: Pick<ActivityEntry, "action" | "before" | "after"> & {
      eventType: WebhookEventType
      video: VideoRecord
    },
    transaction: Transaction
  ) {
    await this.webhookEventsService.publishEvent(
      library.id,
      toVideoWebhookEvent(eventType, video),
      transaction
    )
    await this.activityLogService.recordActivity(
      actor,
      {
        organizationId: library.organizationId,
        action,
        resource: videoActivityResource(video),
        context: libraryActivityContext(library),
        ...changes,
      },
      transaction
    )
  }

  private async toVideoDtoWithImport(video: VideoRecord) {
    const videoImport = await this.videosRepository.findImportOfVideo(video.id)

    return toVideoDto(video, videoImport?.url ?? null)
  }

  private async findVideo(library: LibraryProfile, videoId: string) {
    const video = await this.videosRepository.findVideo({
      organizationId: library.organizationId,
      libraryId: library.id,
      videoId,
    })

    if (!video) throw new DomainError(LIBRARY_ERRORS.VIDEO_NOT_FOUND)

    return video
  }
}
