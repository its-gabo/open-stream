import { ACTIVITY_RESOURCE_TYPES } from "@workspace/shared"
import type { ActivityResource } from "../../activity/types/activity.types"
import type { PlaylistRecord } from "../../db/schema"

export const playlistActivityResource = (
  playlist: Pick<PlaylistRecord, "id" | "title">
): ActivityResource => ({
  type: ACTIVITY_RESOURCE_TYPES.PLAYLIST,
  id: playlist.id,
  label: playlist.title,
})

/** What the activity log keeps of a playlist's details. */
export const toPlaylistActivityValues = (
  playlist: Pick<PlaylistRecord, "title" | "description">
) => ({ title: playlist.title, description: playlist.description })
