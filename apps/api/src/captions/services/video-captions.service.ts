import { randomUUID } from "node:crypto"
import {
  ACTIVITY_ACTIONS,
  VIDEO_CAPTION_LIMITS,
  VIDEO_PROCESSING_STATUSES,
  WEBHOOK_EVENT_TYPES,
  type VideoCaptionKind,
} from "@workspace/shared"
import type { ActivityLogService } from "../../activity/services/activity-log.service"
import type {
  ActivityActor,
  ActivityEntry,
} from "../../activity/types/activity.types"
import { diffActivityValues } from "../../activity/utils/activity-changes.utils"
import { DomainError } from "../../common/errors/domain-error"
import type { Logger } from "../../common/logging/logger"
import { toError } from "../../common/utils/error.utils"
import type { Transaction } from "../../db/database.types"
import type { VideoCaptionRecord, VideoRecord } from "../../db/schema"
import { LIBRARY_ERRORS } from "../../libraries/errors/libraries.errors"
import type { LibraryStorageService } from "../../libraries/services/library-storage.service"
import type {
  LibraryProfile,
  PlaybackFile,
  VideoScope,
} from "../../libraries/types/libraries.types"
import {
  libraryActivityContext,
  videoActivityResource,
} from "../../libraries/utils/library-activity.utils"
import { captionsPrefixOf } from "../../libraries/utils/video-files.utils"
import type { ObjectStorage } from "../../storage/types/storage.types"
import type { WebhookEventsService } from "../../webhooks/services/webhook-events.service"
import { CAPTION_FILE_CONTENT_TYPE } from "../constants/captions.constants"
import {
  toVideoCaptionDto,
  toVideoTranscriptionDto,
} from "../dto/captions.dto.mappers"
import type {
  VideoCaptionUpdateBody,
  VideoCaptionUploadBody,
} from "../dto/captions.schemas"
import { VIDEO_CAPTION_ERRORS } from "../errors/captions.errors"
import type { VideoCaptionsRepository } from "../repository/video-captions.repository"
import type {
  CaptionCue,
  CaptionFileChanges,
  VideoCaptionScope,
} from "../types/captions.types"
import { toVideoCaptionActivityValues } from "../utils/caption-activity.utils"
import { buildCaptionVtt, parseCaptionFile } from "../utils/caption-file.utils"

/** How many of a video's latest transcriptions its caption list shows. */
const LISTED_TRANSCRIPTIONS = 5

/** A track to store: its cues, what it is, and where it came from. */
type CaptionTrack = {
  language: string
  label: string
  kind: VideoCaptionKind
  cues: CaptionCue[]
  transcriptionId: string | null
  createdById: string | null
}

/**
 * A processed video's caption tracks: uploaded WebVTT or SRT files, and the
 * tracks transcriptions write. Every track is stored as sanitized WebVTT
 * next to the video's files; a new track of a language and kind the video
 * has replaces that one.
 */
export class VideoCaptionsService {
  constructor(
    private readonly videoCaptionsRepository: VideoCaptionsRepository,
    private readonly libraryStorageService: LibraryStorageService,
    private readonly objectStorage: ObjectStorage,
    private readonly webhookEventsService: WebhookEventsService,
    private readonly activityLogService: ActivityLogService,
    private readonly logger: Logger
  ) {}

  /** Tracks by language, with the latest transcriptions so their progress and failures show. */
  async listVideoCaptions(library: LibraryProfile, videoId: string) {
    const scope = this.toVideoScope(library, videoId)
    const video = await this.videoCaptionsRepository.findVideo(scope)

    if (!video) throw new DomainError(LIBRARY_ERRORS.VIDEO_NOT_FOUND)

    const [captions, transcriptions] = await Promise.all([
      this.videoCaptionsRepository.listCaptions(scope),
      this.videoCaptionsRepository.listTranscriptions(
        scope,
        LISTED_TRANSCRIPTIONS
      ),
    ])

    return {
      captions: captions.map(toVideoCaptionDto),
      transcriptions: transcriptions.map(({ transcription, providerName }) =>
        toVideoTranscriptionDto(transcription, providerName)
      ),
    }
  }

  /**
   * Stores an uploaded WebVTT or SRT file as a track of a processed video.
   * Its cues are sanitized and kept within the video; a track of the same
   * language and kind is replaced, and counts as uploaded from then on.
   */
  async uploadCaption(
    library: LibraryProfile,
    actor: ActivityActor,
    videoId: string,
    { file, ...input }: VideoCaptionUploadBody
  ) {
    if (file.size > VIDEO_CAPTION_LIMITS.MAX_FILE_SIZE_BYTES) {
      throw new DomainError(VIDEO_CAPTION_ERRORS.FILE_TOO_LARGE)
    }

    const content = decodeText(await file.bytes())
    const video = await this.videoCaptionsRepository.findVideo(
      this.toVideoScope(library, videoId)
    )

    if (!video) throw new DomainError(LIBRARY_ERRORS.VIDEO_NOT_FOUND)

    const durationSeconds = assertProcessed(video).durationSeconds
    const cues =
      content === null ? null : parseCaptionFile(content, durationSeconds)

    if (!cues) throw new DomainError(VIDEO_CAPTION_ERRORS.INVALID_FILE)

    if (cues.length > VIDEO_CAPTION_LIMITS.MAX_CUES) {
      throw new DomainError(VIDEO_CAPTION_ERRORS.TOO_MANY_CUES)
    }

    const saved = await this.saveTracksInTransaction(
      library.id,
      async (transaction, files) => {
        const locked = await this.lockVideo(library, videoId, transaction)
        const { caption, replaced } = await this.saveTrack(
          locked,
          {
            ...input,
            cues,
            transcriptionId: null,
            createdById: actor.userId,
          },
          transaction,
          files
        )

        await this.recordCaptionChange(
          library,
          actor,
          {
            action: ACTIVITY_ACTIONS.VIDEO_CAPTION_UPLOADED,
            video: locked,
            caption,
            ...(replaced
              ? diffActivityValues(
                  toVideoCaptionActivityValues(replaced),
                  toVideoCaptionActivityValues(caption)
                )
              : { after: toVideoCaptionActivityValues(caption) }),
          },
          transaction
        )

        return caption
      }
    )

    return { caption: toVideoCaptionDto(saved) }
  }

  /**
   * Runs a transaction that saves tracks, and keeps their files in step with
   * it. Every save writes a new file and leaves the old one alone, so players
   * keep the stored tracks until the transaction commits: then the replaced
   * files are removed, and on a rollback the files it wrote are.
   */
  async saveTracksInTransaction<T>(
    libraryId: string,
    saveTracks: (
      transaction: Transaction,
      files: CaptionFileChanges
    ) => Promise<T>
  ) {
    const files: CaptionFileChanges = { written: [], replaced: [] }
    let result: T

    try {
      result = await this.videoCaptionsRepository.transaction((transaction) =>
        saveTracks(transaction, files)
      )
    } catch (error) {
      await this.removeCaptionFiles(libraryId, files.written)
      throw error
    }

    await this.removeCaptionFiles(libraryId, files.replaced)

    return result
  }

  /**
   * Stores the track a transcription wrote, in the transaction that
   * completes it, which `saveTracksInTransaction` runs; the video must be
   * locked. Returns null when the video already has as many tracks as it
   * may have.
   */
  async saveTranscribedTrack(
    video: VideoRecord,
    track: CaptionTrack,
    transaction: Transaction,
    files: CaptionFileChanges
  ) {
    try {
      return (await this.saveTrack(video, track, transaction, files)).caption
    } catch (error) {
      if (
        error instanceof DomainError &&
        error.definition === VIDEO_CAPTION_ERRORS.LIMIT_REACHED
      ) {
        return null
      }

      throw error
    }
  }

  /** Renames a track or makes it the default; saving the same values changes and records nothing. */
  async updateCaption(
    library: LibraryProfile,
    actor: ActivityActor,
    { videoId, captionId }: { videoId: string; captionId: string },
    input: VideoCaptionUpdateBody
  ) {
    const updated = await this.videoCaptionsRepository.transaction(
      async (transaction) => {
        const video = await this.lockVideo(library, videoId, transaction)
        const caption = await this.findCaptionForUpdate(
          { ...this.toVideoScope(library, video.id), captionId },
          transaction
        )

        if (
          caption.label === input.label &&
          caption.isDefault === input.isDefault
        ) {
          return caption
        }

        if (input.isDefault) {
          await this.videoCaptionsRepository.clearDefaultCaption(
            video.id,
            caption.id,
            transaction
          )
        }

        const changed = await this.videoCaptionsRepository.updateCaption(
          caption.id,
          input,
          transaction
        )

        if (!changed) throw new DomainError(VIDEO_CAPTION_ERRORS.NOT_FOUND)

        await this.recordCaptionChange(
          library,
          actor,
          {
            action: ACTIVITY_ACTIONS.VIDEO_CAPTION_UPDATED,
            video,
            caption: changed,
            ...diffActivityValues(
              toVideoCaptionActivityValues(caption),
              toVideoCaptionActivityValues(changed)
            ),
          },
          transaction
        )

        return changed
      }
    )

    return { caption: toVideoCaptionDto(updated) }
  }

  /** The transcription that wrote it stays in the video's history. */
  async deleteCaption(
    library: LibraryProfile,
    actor: ActivityActor,
    { videoId, captionId }: { videoId: string; captionId: string }
  ) {
    const deleted = await this.videoCaptionsRepository.transaction(
      async (transaction) => {
        const video = await this.lockVideo(library, videoId, transaction)
        const caption = await this.findCaptionForUpdate(
          { ...this.toVideoScope(library, video.id), captionId },
          transaction
        )

        await this.videoCaptionsRepository.deleteCaption(
          caption.id,
          transaction
        )
        await this.webhookEventsService.publishEvent(
          library.id,
          {
            type: WEBHOOK_EVENT_TYPES.VIDEO_CAPTION_DELETED,
            data: toVideoCaptionDto(caption),
          },
          transaction
        )
        await this.recordCaptionChange(
          library,
          actor,
          {
            action: ACTIVITY_ACTIONS.VIDEO_CAPTION_DELETED,
            video,
            caption,
            before: toVideoCaptionActivityValues(caption),
          },
          transaction
        )

        return caption
      }
    )

    await this.removeCaptionFile(library.id, deleted.objectKey)
  }

  /** A track's WebVTT, for members in the web app, e.g. to download it. */
  async readCaptionFileForMember(
    library: LibraryProfile,
    { videoId, captionId }: { videoId: string; captionId: string }
  ) {
    const caption = await this.videoCaptionsRepository.findCaption({
      ...this.toVideoScope(library, videoId),
      captionId,
    })

    if (!caption) throw new DomainError(VIDEO_CAPTION_ERRORS.NOT_FOUND)

    return {
      caption,
      file: await this.readCaptionFile(library.id, caption),
    }
  }

  /** A track's WebVTT as stored; it is never rewritten, unlike playlists. */
  async readCaptionFile(
    libraryId: string,
    caption: VideoCaptionRecord
  ): Promise<PlaybackFile> {
    const storage =
      await this.libraryStorageService.resolveLibraryStorage(libraryId)

    try {
      return {
        contentType: CAPTION_FILE_CONTENT_TYPE,
        body: await this.objectStorage.streamObject(
          storage.location,
          caption.objectKey
        ),
      }
    } catch (error) {
      this.logger.error("Could not read a caption file", {
        captionId: caption.id,
        error: toError(error),
      })

      throw new DomainError(LIBRARY_ERRORS.STORAGE_UNAVAILABLE)
    }
  }

  /**
   * Writes the track's WebVTT to a new file and creates or replaces its row;
   * the video must be locked. A replaced track keeps its id and default, and
   * its old file is noted in `files` for removal once the save commits.
   */
  private async saveTrack(
    video: VideoRecord,
    track: CaptionTrack,
    transaction: Transaction,
    files: CaptionFileChanges
  ) {
    const sourceObjectKey = assertProcessed(video).sourceObjectKey
    const replaced = await this.videoCaptionsRepository.findCaptionOfLanguage(
      { videoId: video.id, language: track.language, kind: track.kind },
      transaction
    )

    if (
      !replaced &&
      (await this.videoCaptionsRepository.countCaptions(
        video.id,
        transaction
      )) >= VIDEO_CAPTION_LIMITS.MAX_PER_VIDEO
    ) {
      throw new DomainError(VIDEO_CAPTION_ERRORS.LIMIT_REACHED)
    }

    const objectKey = `${captionsPrefixOf(sourceObjectKey)}${randomUUID()}.vtt`
    const body = new TextEncoder().encode(buildCaptionVtt(track.cues))
    const storage = await this.libraryStorageService.resolveLibraryStorage(
      video.libraryId,
      transaction
    )

    try {
      await this.objectStorage.putObject(
        storage.location,
        objectKey,
        body,
        CAPTION_FILE_CONTENT_TYPE
      )
    } catch (error) {
      this.logger.error("Could not store a caption file", {
        videoId: video.id,
        error: toError(error),
      })

      throw new DomainError(LIBRARY_ERRORS.STORAGE_UNAVAILABLE)
    }

    files.written.push(objectKey)

    if (replaced) files.replaced.push(replaced.objectKey)

    const fields = {
      label: track.label,
      objectKey,
      sizeBytes: body.byteLength,
      cueCount: track.cues.length,
      transcriptionId: track.transcriptionId,
    }
    const caption = replaced
      ? await this.videoCaptionsRepository.updateCaption(
          replaced.id,
          fields,
          transaction
        )
      : await this.videoCaptionsRepository.insertCaption(
          {
            organizationId: video.organizationId,
            libraryId: video.libraryId,
            videoId: video.id,
            language: track.language,
            kind: track.kind,
            createdById: track.createdById,
            ...fields,
          },
          transaction
        )

    await this.webhookEventsService.publishEvent(
      video.libraryId,
      {
        type: WEBHOOK_EVENT_TYPES.VIDEO_CAPTION_READY,
        data: toVideoCaptionDto(caption!),
      },
      transaction
    )

    return { caption: caption!, replaced }
  }

  private async removeCaptionFiles(libraryId: string, objectKeys: string[]) {
    for (const objectKey of objectKeys) {
      await this.removeCaptionFile(libraryId, objectKey)
    }
  }

  /** A file left behind costs a little storage; the video's folder goes with the video. */
  private async removeCaptionFile(libraryId: string, objectKey: string) {
    try {
      const storage =
        await this.libraryStorageService.resolveLibraryStorage(libraryId)

      await this.objectStorage.deleteObject(storage.location, objectKey)
    } catch (error) {
      this.logger.warn("Could not remove a caption file", {
        objectKey,
        error: toError(error),
      })
    }
  }

  private toVideoScope(library: LibraryProfile, videoId: string): VideoScope {
    return {
      organizationId: library.organizationId,
      libraryId: library.id,
      videoId,
    }
  }

  private async lockVideo(
    library: LibraryProfile,
    videoId: string,
    transaction: Transaction
  ) {
    const video = await this.videoCaptionsRepository.lockVideo(
      this.toVideoScope(library, videoId),
      transaction
    )

    if (!video) throw new DomainError(LIBRARY_ERRORS.VIDEO_NOT_FOUND)

    return video
  }

  private async findCaptionForUpdate(
    scope: VideoCaptionScope,
    transaction: Transaction
  ) {
    const caption = await this.videoCaptionsRepository.findCaptionForUpdate(
      scope,
      transaction
    )

    if (!caption) throw new DomainError(VIDEO_CAPTION_ERRORS.NOT_FOUND)

    return caption
  }

  private async recordCaptionChange(
    library: LibraryProfile,
    actor: ActivityActor,
    {
      action,
      video,
      caption,
      ...changes
    }: Pick<ActivityEntry, "action" | "before" | "after"> & {
      video: VideoRecord
      caption: VideoCaptionRecord
    },
    transaction: Transaction
  ) {
    await this.activityLogService.recordActivity(
      actor,
      {
        organizationId: library.organizationId,
        action,
        resource: videoActivityResource(video),
        context: { ...libraryActivityContext(library), captionId: caption.id },
        ...changes,
      },
      transaction
    )
  }
}

/** Tracks belong to processed videos, whose duration their cues must fit. */
export function assertProcessed(video: VideoRecord) {
  if (
    video.processingStatus !== VIDEO_PROCESSING_STATUSES.READY ||
    video.durationSeconds === null ||
    !video.sourceObjectKey
  ) {
    throw new DomainError(LIBRARY_ERRORS.VIDEO_NOT_READY)
  }

  return {
    durationSeconds: video.durationSeconds,
    sourceObjectKey: video.sourceObjectKey,
  }
}

/** UTF-8 text, or null for bytes that are not, e.g. a binary file. */
const decodeText = (bytes: Uint8Array) => {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes)
  } catch {
    return null
  }
}
