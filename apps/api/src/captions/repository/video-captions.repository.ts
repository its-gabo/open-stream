import { VIDEO_TRANSCRIPTION_STATUSES } from "@workspace/shared"
import type { VideoTranscriptionFailureReason } from "@workspace/shared"
import {
  and,
  asc,
  desc,
  eq,
  inArray,
  isNotNull,
  isNull,
  lt,
  ne,
  sql,
  or,
} from "drizzle-orm"
import type {
  Database,
  DatabaseExecutor,
  Transaction,
} from "../../db/database.types"
import {
  libraries,
  transcriptionProviders,
  videoCaptions,
  videoTranscriptions,
  videos,
  type NewVideoCaptionRecord,
  type NewVideoTranscriptionRecord,
} from "../../db/schema"
import type { VideoScope } from "../../libraries/types/libraries.types"
import { videoInScope } from "../../libraries/utils/video-query.utils"
import type {
  LibraryTranscriptionSettings,
  VideoCaptionScope,
} from "../types/captions.types"
import {
  activeTranscriptionStatuses,
  transcriptionRunCondition,
  videoCaptionInScope,
  videoCaptionsOfVideo,
} from "../utils/caption-query.utils"

const libraryTranscriptionColumns = {
  providerId: libraries.transcriptionProviderId,
  autoTranscribe: libraries.autoTranscribe,
  language: libraries.transcriptionLanguage,
}

export class VideoCaptionsRepository {
  constructor(private readonly db: Database) {}

  transaction<T>(work: (transaction: Transaction) => Promise<T>) {
    return this.db.transaction(work)
  }

  async findVideo(scope: VideoScope) {
    const [video] = await this.db
      .select()
      .from(videos)
      .where(videoInScope(scope))

    return video ?? null
  }

  async findVideoById(videoId: string, executor: DatabaseExecutor = this.db) {
    const [video] = await executor
      .select()
      .from(videos)
      .where(eq(videos.id, videoId))

    return video ?? null
  }

  /** Taken before a video's tracks change, so the limits and the one default hold under concurrent changes. */
  async lockVideo(scope: VideoScope, transaction: Transaction) {
    const [video] = await transaction
      .select()
      .from(videos)
      .where(videoInScope(scope))
      .for("update")

    return video ?? null
  }

  async lockVideoById(videoId: string, transaction: Transaction) {
    const [video] = await transaction
      .select()
      .from(videos)
      .where(eq(videos.id, videoId))
      .for("update")

    return video ?? null
  }

  /** By language, then subtitles before captions. */
  listCaptions(scope: VideoScope) {
    return this.db
      .select()
      .from(videoCaptions)
      .where(videoCaptionsOfVideo(scope))
      .orderBy(
        asc(videoCaptions.language),
        desc(videoCaptions.kind),
        asc(videoCaptions.id)
      )
  }

  async findCaption(scope: VideoCaptionScope) {
    const [caption] = await this.db
      .select()
      .from(videoCaptions)
      .where(videoCaptionInScope(scope))

    return caption ?? null
  }

  async findCaptionForUpdate(
    scope: VideoCaptionScope,
    transaction: Transaction
  ) {
    const [caption] = await transaction
      .select()
      .from(videoCaptions)
      .where(videoCaptionInScope(scope))
      .for("update")

    return caption ?? null
  }

  async findCaptionOfLanguage(
    {
      videoId,
      language,
      kind,
    }: Pick<NewVideoCaptionRecord, "videoId" | "language" | "kind">,
    transaction: Transaction
  ) {
    const [caption] = await transaction
      .select()
      .from(videoCaptions)
      .where(
        and(
          eq(videoCaptions.videoId, videoId),
          eq(videoCaptions.language, language),
          eq(videoCaptions.kind, kind)
        )
      )
      .for("update")

    return caption ?? null
  }

  countCaptions(videoId: string, transaction: Transaction) {
    return transaction.$count(videoCaptions, eq(videoCaptions.videoId, videoId))
  }

  async insertCaption(
    caption: NewVideoCaptionRecord,
    transaction: Transaction
  ) {
    const [created] = await transaction
      .insert(videoCaptions)
      .values(caption)
      .returning()

    return created!
  }

  async updateCaption(
    captionId: string,
    changes: Partial<NewVideoCaptionRecord>,
    transaction: Transaction
  ) {
    const [updated] = await transaction
      .update(videoCaptions)
      .set({ ...changes, updatedAt: new Date() })
      .where(eq(videoCaptions.id, captionId))
      .returning()

    return updated ?? null
  }

  /** Before another track becomes the default, as a video has one at most. */
  async clearDefaultCaption(
    videoId: string,
    exceptCaptionId: string,
    transaction: Transaction
  ) {
    await transaction
      .update(videoCaptions)
      .set({ isDefault: false, updatedAt: new Date() })
      .where(
        and(
          eq(videoCaptions.videoId, videoId),
          eq(videoCaptions.isDefault, true),
          ne(videoCaptions.id, exceptCaptionId)
        )
      )
  }

  async deleteCaption(captionId: string, transaction: Transaction) {
    await transaction
      .delete(videoCaptions)
      .where(eq(videoCaptions.id, captionId))
  }

  async findLibraryTranscription(
    libraryId: string,
    executor: DatabaseExecutor = this.db
  ): Promise<LibraryTranscriptionSettings | null> {
    const [settings] = await executor
      .select(libraryTranscriptionColumns)
      .from(libraries)
      .where(eq(libraries.id, libraryId))

    return settings ?? null
  }

  async updateLibraryTranscription(
    libraryId: string,
    settings: LibraryTranscriptionSettings,
    transaction: Transaction
  ) {
    const [updated] = await transaction
      .update(libraries)
      .set({
        transcriptionProviderId: settings.providerId,
        autoTranscribe: settings.autoTranscribe,
        transcriptionLanguage: settings.language,
        updatedAt: new Date(),
      })
      .where(eq(libraries.id, libraryId))
      .returning(libraryTranscriptionColumns)

    return updated ?? null
  }

  /** Newest first, with the provider's name when it still exists. */
  listTranscriptions(scope: VideoScope, limit: number) {
    return this.db
      .select({
        transcription: videoTranscriptions,
        providerName: transcriptionProviders.name,
      })
      .from(videoTranscriptions)
      .leftJoin(
        transcriptionProviders,
        eq(transcriptionProviders.id, videoTranscriptions.providerId)
      )
      .where(
        and(
          eq(videoTranscriptions.organizationId, scope.organizationId),
          eq(videoTranscriptions.libraryId, scope.libraryId),
          eq(videoTranscriptions.videoId, scope.videoId)
        )
      )
      .orderBy(
        desc(videoTranscriptions.createdAt),
        desc(videoTranscriptions.id)
      )
      .limit(limit)
  }

  /** Whether the video was ever transcribed or given a track, so transcribing it by itself would repeat work. */
  async hasCaptionsOrTranscriptions(videoId: string, transaction: Transaction) {
    const [captions, transcriptions] = await Promise.all([
      transaction.$count(videoCaptions, eq(videoCaptions.videoId, videoId)),
      transaction.$count(
        videoTranscriptions,
        eq(videoTranscriptions.videoId, videoId)
      ),
    ])

    return captions + transcriptions > 0
  }

  async findActiveTranscription(videoId: string, transaction: Transaction) {
    const [active] = await transaction
      .select()
      .from(videoTranscriptions)
      .where(
        and(
          eq(videoTranscriptions.videoId, videoId),
          inArray(videoTranscriptions.status, activeTranscriptionStatuses)
        )
      )

    return active ?? null
  }

  /** Counts audio the provider answered for, while `runId` still holds the transcription. */
  async addTranscribedAudioSeconds(
    transcriptionId: string,
    runId: string,
    seconds: number
  ) {
    await this.db
      .update(videoTranscriptions)
      .set({
        transcribedAudioSeconds: sql`${videoTranscriptions.transcribedAudioSeconds} + ${seconds}`,
      })
      .where(
        and(
          eq(videoTranscriptions.id, transcriptionId),
          eq(videoTranscriptions.runId, runId)
        )
      )
  }

  async insertTranscription(
    transcription: NewVideoTranscriptionRecord,
    transaction: Transaction
  ) {
    const [created] = await transaction
      .insert(videoTranscriptions)
      .values(transcription)
      .returning()

    return created!
  }

  async findTranscription(transcriptionId: string) {
    const [transcription] = await this.db
      .select()
      .from(videoTranscriptions)
      .where(eq(videoTranscriptions.id, transcriptionId))

    return transcription ?? null
  }

  /**
   * Takes a pending transcription, or one whose run died or let it go, for
   * run `runId`; null when it is finished, gone, or held by a live run.
   */
  async claimTranscription(
    transcriptionId: string,
    runId: string,
    staleBefore: Date
  ) {
    const [claimed] = await this.db
      .update(videoTranscriptions)
      .set({
        status: VIDEO_TRANSCRIPTION_STATUSES.PROCESSING,
        runId,
        heartbeatAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(videoTranscriptions.id, transcriptionId),
          or(
            eq(
              videoTranscriptions.status,
              VIDEO_TRANSCRIPTION_STATUSES.PENDING
            ),
            and(
              eq(
                videoTranscriptions.status,
                VIDEO_TRANSCRIPTION_STATUSES.PROCESSING
              ),
              or(
                isNull(videoTranscriptions.runId),
                lt(videoTranscriptions.heartbeatAt, staleBefore)
              )
            )
          )
        )
      )
      .returning()

    return claimed ?? null
  }

  async renewTranscriptionClaim(transcriptionId: string, runId: string) {
    const [renewed] = await this.db
      .update(videoTranscriptions)
      .set({ heartbeatAt: new Date() })
      .where(transcriptionRunCondition(transcriptionId, runId))
      .returning({ id: videoTranscriptions.id })

    return renewed !== undefined
  }

  /** Lets the queue's next attempt claim the transcription right away. */
  async releaseTranscriptionClaim(transcriptionId: string, runId: string) {
    await this.db
      .update(videoTranscriptions)
      .set({ runId: null, heartbeatAt: new Date() })
      .where(transcriptionRunCondition(transcriptionId, runId))
  }

  /** Null when run `runId` no longer holds the transcription. */
  async completeTranscription(
    transcriptionId: string,
    runId: string,
    detectedLanguage: string | null,
    transaction: Transaction
  ) {
    const [completed] = await transaction
      .update(videoTranscriptions)
      .set({
        status: VIDEO_TRANSCRIPTION_STATUSES.SUCCEEDED,
        detectedLanguage,
        runId: null,
        heartbeatAt: null,
        finishedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(transcriptionRunCondition(transcriptionId, runId))
      .returning()

    return completed ?? null
  }

  /** Null when run `runId` no longer holds the transcription. */
  async failTranscription(
    transcriptionId: string,
    runId: string,
    reason: VideoTranscriptionFailureReason,
    transaction: Transaction
  ) {
    const [failed] = await transaction
      .update(videoTranscriptions)
      .set(failedTranscription(reason))
      .where(transcriptionRunCondition(transcriptionId, runId))
      .returning()

    return failed ?? null
  }

  /**
   * Fails the transcriptions whose run died, and those released for an
   * attempt that never came; returns them.
   */
  failStalledTranscriptions(
    {
      staleBefore,
      releasedBefore,
    }: { staleBefore: Date; releasedBefore: Date },
    reason: VideoTranscriptionFailureReason,
    transaction: Transaction
  ) {
    return transaction
      .update(videoTranscriptions)
      .set(failedTranscription(reason))
      .where(
        and(
          eq(
            videoTranscriptions.status,
            VIDEO_TRANSCRIPTION_STATUSES.PROCESSING
          ),
          or(
            and(
              isNotNull(videoTranscriptions.runId),
              lt(videoTranscriptions.heartbeatAt, staleBefore)
            ),
            and(
              isNull(videoTranscriptions.runId),
              lt(videoTranscriptions.heartbeatAt, releasedBefore)
            )
          )
        )
      )
      .returning()
  }
}

const failedTranscription = (reason: VideoTranscriptionFailureReason) => ({
  status: VIDEO_TRANSCRIPTION_STATUSES.FAILED,
  failureReason: reason,
  runId: null,
  heartbeatAt: null,
  finishedAt: new Date(),
  updatedAt: new Date(),
})
