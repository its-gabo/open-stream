import { and, count, eq, getTableColumns, sql } from "drizzle-orm"
import { playlistItems, playlists, videos } from "../../db/schema"
import type { PlaylistScope } from "../types/playlists.types"

export const playlistInScope = ({
  organizationId,
  libraryId,
  playlistId,
}: PlaylistScope) =>
  and(
    eq(playlists.organizationId, organizationId),
    eq(playlists.libraryId, libraryId),
    eq(playlists.id, playlistId)
  )

/** A `PlaylistSummary`; needs `playlistItems` and `videos` left-joined and grouping by playlist. */
export const playlistSummaryColumns = {
  ...getTableColumns(playlists),
  videoCount: count(playlistItems.videoId),
  durationSeconds: sql<number>`coalesce(sum(${videos.durationSeconds}), 0)::float8`,
}
