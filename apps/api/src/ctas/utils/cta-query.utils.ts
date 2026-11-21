import { VIDEO_CTA_PLACEMENTS } from "@workspace/shared"
import { and, asc, eq, ilike, sql } from "drizzle-orm"
import { toContainsPattern } from "../../db/database.utils"
import { videoCtaLeads, videoCtas } from "../../db/schema"
import type { VideoCtaLeadFilter, VideoCtaScope } from "../types/ctas.types"

export const videoCtaInScope = ({
  organizationId,
  libraryId,
  videoId,
  ctaId,
}: VideoCtaScope) =>
  and(
    eq(videoCtas.organizationId, organizationId),
    eq(videoCtas.libraryId, libraryId),
    eq(videoCtas.videoId, videoId),
    eq(videoCtas.id, ctaId)
  )

/** Overlays by when they appear, then the end screen. */
export const videoCtaPlaybackOrder = [
  asc(sql`${videoCtas.placement} = ${VIDEO_CTA_PLACEMENTS.END_SCREEN}`),
  asc(videoCtas.startSeconds),
  asc(videoCtas.createdAt),
  asc(videoCtas.id),
]

export const videoCtaLeadCondition = ({
  organizationId,
  libraryId,
  videoId,
  search,
}: VideoCtaLeadFilter) =>
  and(
    eq(videoCtaLeads.organizationId, organizationId),
    eq(videoCtaLeads.libraryId, libraryId),
    videoId ? eq(videoCtaLeads.videoId, videoId) : undefined,
    search ? ilike(videoCtaLeads.email, toContainsPattern(search)) : undefined
  )
