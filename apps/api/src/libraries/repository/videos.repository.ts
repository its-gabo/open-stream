import {
  VIDEO_PROCESSING_STATUSES,
  type VideoProcessingFailureReason,
} from "@workspace/shared"
import {
  and,
  desc,
  eq,
  inArray,
  isNotNull,
  isNull,
  lt,
  or,
  sql,
} from "drizzle-orm"
import type { PageWindow } from "../../common/http/pagination/pagination.types"
import type {
  Database,
  DatabaseExecutor,
  Transaction,
} from "../../db/database.types"
import {
  videoUploads,
  videos,
  type NewVideoRecord,
  type NewVideoUploadRecord,
} from "../../db/schema"
import type { StorageMultipartPart } from "../../storage/types/storage.types"
import type {
  VideoListFilter,
  VideoProcessingResult,
  VideoScope,
} from "../types/libraries.types"
import { videoInScope, videoListCondition } from "../utils/video-query.utils"

export class VideosRepository {
  constructor(private readonly db: Database) {}

  transaction<T>(work: (transaction: Transaction) => Promise<T>) {
    return this.db.transaction(work)
  }

  listVideos(organizationId: string, libraryId: string) {
    return this.db
      .select()
      .from(videos)
      .where(
        and(
          eq(videos.organizationId, organizationId),
          eq(videos.libraryId, libraryId)
        )
      )
      .orderBy(desc(videos.createdAt))
  }

  listVideoPage(filter: VideoListFilter, window: PageWindow) {
    return this.db
      .select()
      .from(videos)
      .where(videoListCondition(filter))
      .orderBy(desc(videos.createdAt), desc(videos.id))
      .limit(window.limit)
      .offset(window.offset)
  }

  countVideos(filter: VideoListFilter) {
    return this.db.$count(videos, videoListCondition(filter))
  }

  async findVideo(scope: VideoScope) {
    const [video] = await this.db
      .select()
      .from(videos)
      .where(videoInScope(scope))

    return video ?? null
  }

  async lockVideo(scope: VideoScope, transaction: Transaction) {
    const [video] = await transaction
      .select()
      .from(videos)
      .where(videoInScope(scope))
      .for("update")

    return video ?? null
  }

  async insertVideo(video: NewVideoRecord, transaction: Transaction) {
    const [created] = await transaction.insert(videos).values(video).returning()

    return created!
  }

  async updateVideo(
    videoId: string,
    changes: Partial<NewVideoRecord>,
    executor: DatabaseExecutor = this.db
  ) {
    const [video] = await executor
      .update(videos)
      .set(changes)
      .where(eq(videos.id, videoId))
      .returning()

    return video ?? null
  }

  async deleteVideo(videoId: string, transaction: Transaction) {
    const [deleted] = await transaction
      .delete(videos)
      .where(eq(videos.id, videoId))
      .returning()

    return deleted ?? null
  }

  /** Every video of the organization that has or had a file in storage, with its unfinished upload. */
  listVideoFilesOfOrganization(
    organizationId: string,
    transaction: Transaction
  ) {
    return transaction
      .select({
        libraryId: videos.libraryId,
        sourceObjectKey: videos.sourceObjectKey,
        upload: videoUploads,
      })
      .from(videos)
      .leftJoin(videoUploads, eq(videoUploads.videoId, videos.id))
      .where(
        and(
          eq(videos.organizationId, organizationId),
          or(isNotNull(videos.sourceObjectKey), isNotNull(videoUploads.id))
        )
      )
  }

  /** The upload only when it belongs to the video in scope. */
  async findUpload(scope: VideoScope, uploadId: string) {
    const [upload] = await this.db
      .select({ upload: videoUploads })
      .from(videoUploads)
      .innerJoin(videos, eq(videos.id, videoUploads.videoId))
      .where(and(videoInScope(scope), eq(videoUploads.id, uploadId)))

    return upload?.upload ?? null
  }

  async findUploadOfVideo(
    videoId: string,
    executor: DatabaseExecutor = this.db
  ) {
    const [upload] = await executor
      .select()
      .from(videoUploads)
      .where(eq(videoUploads.videoId, videoId))

    return upload ?? null
  }

  async insertUpload(upload: NewVideoUploadRecord, transaction: Transaction) {
    const [created] = await transaction
      .insert(videoUploads)
      .values(upload)
      .returning()

    return created!
  }

  /** Null when the upload was finished, canceled or replaced meanwhile. */
  async deleteUpload(uploadId: string, transaction: Transaction) {
    const [deleted] = await transaction
      .delete(videoUploads)
      .where(eq(videoUploads.id, uploadId))
      .returning()

    return deleted ?? null
  }

  async deleteUploadOfVideo(videoId: string, transaction: Transaction) {
    const [deleted] = await transaction
      .delete(videoUploads)
      .where(eq(videoUploads.videoId, videoId))
      .returning()

    return deleted ?? null
  }

  /**
   * Reserves a part number for a chunk at `expectedOffset`; null when the
   * upload moved past that offset meanwhile.
   */
  async reserveUploadPartNumber(uploadId: string, expectedOffset: number) {
    const [reserved] = await this.db
      .update(videoUploads)
      .set({ nextPartNumber: sql`${videoUploads.nextPartNumber} + 1` })
      .where(
        and(
          eq(videoUploads.id, uploadId),
          eq(videoUploads.uploadOffset, expectedOffset)
        )
      )
      .returning({ nextPartNumber: videoUploads.nextPartNumber })

    return reserved ? reserved.nextPartNumber - 1 : null
  }

  /**
   * Moves the offset forward only if no other request did since `expectedOffset`
   * was read; returns `null` when it lost that race.
   */
  async advanceUpload(
    uploadId: string,
    expectedOffset: number,
    progress: { uploadOffset: number; parts: StorageMultipartPart[] },
    transaction: Transaction
  ) {
    const [upload] = await transaction
      .update(videoUploads)
      .set(progress)
      .where(
        and(
          eq(videoUploads.id, uploadId),
          eq(videoUploads.uploadOffset, expectedOffset)
        )
      )
      .returning({ id: videoUploads.id })

    return upload ?? null
  }

  /** Deletes a finished upload unless another request already moved its offset; `null` if it lost that race. */
  async deleteUploadAtOffset(
    uploadId: string,
    expectedOffset: number,
    transaction: Transaction
  ) {
    const [upload] = await transaction
      .delete(videoUploads)
      .where(
        and(
          eq(videoUploads.id, uploadId),
          eq(videoUploads.uploadOffset, expectedOffset)
        )
      )
      .returning({ id: videoUploads.id })

    return upload ?? null
  }

  /**
   * Hands the video to run `runId` when it is pending, was released by a
   * failed attempt, or its run stopped renewing its claim before
   * `staleBefore`; null when another run holds it or there is nothing to do.
   * `wasPending` tells a first attempt from a retry.
   */
  async claimVideoForProcessing(
    videoId: string,
    runId: string,
    staleBefore: Date,
    transaction: Transaction
  ) {
    const [video] = await transaction
      .select()
      .from(videos)
      .where(
        and(
          eq(videos.id, videoId),
          isNotNull(videos.sourceObjectKey),
          or(
            eq(videos.processingStatus, VIDEO_PROCESSING_STATUSES.PENDING),
            and(
              eq(videos.processingStatus, VIDEO_PROCESSING_STATUSES.PROCESSING),
              or(
                isNull(videos.processingRunId),
                lt(videos.processingHeartbeatAt, staleBefore)
              )
            )
          )
        )
      )
      .for("update")

    if (!video) return null

    const claimed = await this.updateVideo(
      video.id,
      {
        processingStatus: VIDEO_PROCESSING_STATUSES.PROCESSING,
        processingFailureReason: null,
        processingRunId: runId,
        processingHeartbeatAt: new Date(),
      },
      transaction
    )

    return (
      claimed && {
        video: claimed,
        wasPending:
          video.processingStatus === VIDEO_PROCESSING_STATUSES.PENDING,
      }
    )
  }

  /** False when run `runId` no longer holds the video. */
  async renewProcessingClaim(videoId: string, runId: string) {
    const [renewed] = await this.db
      .update(videos)
      .set({ processingHeartbeatAt: new Date() })
      .where(processingRunCondition(videoId, runId))
      .returning({ id: videos.id })

    return renewed !== undefined
  }

  /** Lets the queue's next attempt claim the video right away. */
  async releaseProcessingClaim(videoId: string, runId: string) {
    await this.db
      .update(videos)
      .set({ processingRunId: null, processingHeartbeatAt: new Date() })
      .where(processingRunCondition(videoId, runId))
  }

  /** Null when run `runId` no longer holds the video: it was deleted, reprocessed or taken over meanwhile. */
  async completeVideoProcessing(
    videoId: string,
    runId: string,
    result: VideoProcessingResult,
    transaction: Transaction
  ) {
    const [completed] = await transaction
      .update(videos)
      .set({
        ...result,
        processingStatus: VIDEO_PROCESSING_STATUSES.READY,
        processingFailureReason: null,
        processingRunId: null,
        processingHeartbeatAt: null,
        processedAt: new Date(),
        posterUpdatedAt: new Date(),
      })
      .where(processingRunCondition(videoId, runId))
      .returning()

    return completed ?? null
  }

  /** Null when run `runId` no longer holds the video. */
  async failVideoProcessing(
    videoId: string,
    runId: string,
    reason: VideoProcessingFailureReason,
    transaction: Transaction
  ) {
    const [failed] = await transaction
      .update(videos)
      .set(failedProcessing(reason))
      .where(processingRunCondition(videoId, runId))
      .returning()

    return failed ?? null
  }

  /**
   * Fails the videos whose run stopped renewing its claim before
   * `staleBefore`, e.g. because the worker was killed, and those released
   * before `releasedBefore`, whose next attempt should have claimed them by then.
   */
  failStalledVideoProcessing(
    {
      staleBefore,
      releasedBefore,
    }: { staleBefore: Date; releasedBefore: Date },
    reason: VideoProcessingFailureReason,
    transaction: Transaction
  ) {
    return transaction
      .update(videos)
      .set(failedProcessing(reason))
      .where(
        and(
          eq(videos.processingStatus, VIDEO_PROCESSING_STATUSES.PROCESSING),
          or(
            and(
              isNotNull(videos.processingRunId),
              lt(videos.processingHeartbeatAt, staleBefore)
            ),
            and(
              isNull(videos.processingRunId),
              lt(videos.processingHeartbeatAt, releasedBefore)
            )
          )
        )
      )
      .returning()
  }

  async videoExists(videoId: string) {
    return (await this.db.$count(videos, eq(videos.id, videoId))) > 0
  }

  /** Queues a ready or failed video for processing again; null while it is pending or processing. */
  async requestVideoReprocessing(videoId: string, transaction: Transaction) {
    const [requested] = await transaction
      .update(videos)
      .set({
        processingStatus: VIDEO_PROCESSING_STATUSES.PENDING,
        processingFailureReason: null,
        processingRunId: null,
        processingHeartbeatAt: null,
      })
      .where(
        and(
          eq(videos.id, videoId),
          isNotNull(videos.sourceObjectKey),
          inArray(videos.processingStatus, [
            VIDEO_PROCESSING_STATUSES.READY,
            VIDEO_PROCESSING_STATUSES.FAILED,
          ])
        )
      )
      .returning()

    return requested ?? null
  }
}

const processingRunCondition = (videoId: string, runId: string) =>
  and(
    eq(videos.id, videoId),
    eq(videos.processingStatus, VIDEO_PROCESSING_STATUSES.PROCESSING),
    eq(videos.processingRunId, runId)
  )

const failedProcessing = (reason: VideoProcessingFailureReason) => ({
  processingStatus: VIDEO_PROCESSING_STATUSES.FAILED,
  processingFailureReason: reason,
  processingRunId: null,
  processingHeartbeatAt: null,
})
