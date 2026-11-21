import { VIDEO_CTA_PLACEMENTS } from "@workspace/shared"
import { and, eq, gt, sql } from "drizzle-orm"
import type {
  Database,
  DatabaseExecutor,
  Transaction,
} from "../../db/database.types"
import {
  type NewVideoCtaLeadRecord,
  type NewVideoCtaRecord,
  videoCtaLeads,
  videoCtas,
  videoViewCtas,
  videoViews,
  videos,
} from "../../db/schema"
import type { VideoScope } from "../../libraries/types/libraries.types"
import { videoInScope } from "../../libraries/utils/video-query.utils"
import { VIDEO_VIEW_CTA_MOMENTS } from "../constants/ctas.constants"
import type {
  ReportableView,
  VideoCtaEventTarget,
  VideoCtaScope,
  VideoViewCtaMoment,
} from "../types/ctas.types"
import {
  videoCtaInScope,
  videoCtaPlaybackOrder,
} from "../utils/cta-query.utils"

const VIEW_CTA_MOMENT_COLUMNS = {
  [VIDEO_VIEW_CTA_MOMENTS.SHOWN]: "shownAt",
  [VIDEO_VIEW_CTA_MOMENTS.CLICKED]: "clickedAt",
  [VIDEO_VIEW_CTA_MOMENTS.DISMISSED]: "dismissedAt",
  [VIDEO_VIEW_CTA_MOMENTS.SUBMITTED]: "submittedAt",
} as const satisfies Record<
  VideoViewCtaMoment,
  keyof typeof videoViewCtas.$inferInsert
>

export class VideoCtasRepository {
  constructor(private readonly db: Database) {}

  transaction<T>(work: (transaction: Transaction) => Promise<T>) {
    return this.db.transaction(work)
  }

  /** In playback order. */
  listVideoCtas(scope: VideoScope) {
    return this.db
      .select()
      .from(videoCtas)
      .where(
        and(
          eq(videoCtas.organizationId, scope.organizationId),
          eq(videoCtas.libraryId, scope.libraryId),
          eq(videoCtas.videoId, scope.videoId)
        )
      )
      .orderBy(...videoCtaPlaybackOrder)
  }

  async findVideoCta(scope: VideoCtaScope) {
    const [cta] = await this.db
      .select()
      .from(videoCtas)
      .where(videoCtaInScope(scope))

    return cta ?? null
  }

  async findVideo(scope: VideoScope) {
    const [video] = await this.db
      .select()
      .from(videos)
      .where(videoInScope(scope))

    return video ?? null
  }

  /** Taken before a video's calls to action change, so the limits hold under concurrent changes. */
  async lockVideo(scope: VideoScope, transaction: Transaction) {
    const [video] = await transaction
      .select()
      .from(videos)
      .where(videoInScope(scope))
      .for("update")

    return video ?? null
  }

  async findVideoCtaForUpdate(scope: VideoCtaScope, transaction: Transaction) {
    const [cta] = await transaction
      .select()
      .from(videoCtas)
      .where(videoCtaInScope(scope))
      .for("update")

    return cta ?? null
  }

  countVideoCtas(videoId: string, transaction: Transaction) {
    return transaction.$count(videoCtas, eq(videoCtas.videoId, videoId))
  }

  async findEndScreenId(videoId: string, transaction: Transaction) {
    const [endScreen] = await transaction
      .select({ id: videoCtas.id })
      .from(videoCtas)
      .where(
        and(
          eq(videoCtas.videoId, videoId),
          eq(videoCtas.placement, VIDEO_CTA_PLACEMENTS.END_SCREEN)
        )
      )

    return endScreen?.id ?? null
  }

  async insertVideoCta(cta: NewVideoCtaRecord, transaction: Transaction) {
    const [created] = await transaction
      .insert(videoCtas)
      .values(cta)
      .returning()

    return created!
  }

  async updateVideoCta(
    ctaId: string,
    changes: Partial<NewVideoCtaRecord>,
    transaction: Transaction
  ) {
    const [cta] = await transaction
      .update(videoCtas)
      .set({ ...changes, updatedAt: new Date() })
      .where(eq(videoCtas.id, ctaId))
      .returning()

    return cta ?? null
  }

  async deleteVideoCta(ctaId: string, transaction: Transaction) {
    await transaction.delete(videoCtas).where(eq(videoCtas.id, ctaId))
  }

  /** A view of the library's video that started after `startedAfter`, so it still takes reports. */
  async findReportableView(
    {
      libraryId,
      videoId,
      viewId,
    }: { libraryId: string; videoId: string; viewId: string },
    startedAfter: Date
  ): Promise<ReportableView | null> {
    const [view] = await this.db
      .select({
        id: videoViews.id,
        videoId: videoViews.videoId,
        libraryId: videoViews.libraryId,
        organizationId: videoViews.organizationId,
        embeddingHost: videoViews.embeddingHost,
        videoTitle: videos.title,
      })
      .from(videoViews)
      .innerJoin(videos, eq(videos.id, videoViews.videoId))
      .where(
        and(
          eq(videoViews.id, viewId),
          eq(videoViews.videoId, videoId),
          eq(videoViews.libraryId, libraryId),
          gt(videoViews.startedAt, startedAfter)
        )
      )

    return view ?? null
  }

  /** Keeps when the view first reached `moment` with the call to action; later reports change nothing. */
  async markViewCta(
    target: VideoCtaEventTarget,
    moment: VideoViewCtaMoment,
    executor: DatabaseExecutor = this.db
  ) {
    const column = VIEW_CTA_MOMENT_COLUMNS[moment]
    const columnName = videoViewCtas[column].name

    await executor
      .insert(videoViewCtas)
      .values({ ...target, [column]: new Date() })
      .onConflictDoUpdate({
        target: [videoViewCtas.viewId, videoViewCtas.ctaId],
        set: {
          [column]: sql`coalesce(${videoViewCtas[column]}, excluded.${sql.identifier(columnName)})`,
        },
      })
  }

  /** Null when the view already left a lead in this call to action. */
  async insertLead(lead: NewVideoCtaLeadRecord, transaction: Transaction) {
    const [created] = await transaction
      .insert(videoCtaLeads)
      .values(lead)
      .onConflictDoNothing({
        target: [videoCtaLeads.viewId, videoCtaLeads.ctaId],
      })
      .returning()

    return created ?? null
  }
}
