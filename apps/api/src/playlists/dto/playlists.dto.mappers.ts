import type { VideoDto } from "../../libraries/dto/libraries.schemas"
import type { PlaylistSummary } from "../types/playlists.types"
import type { PlaylistDto, PlaylistSummaryDto } from "./playlists.schemas"

export const toPlaylistSummaryDto = (
  playlist: PlaylistSummary
): PlaylistSummaryDto => ({
  id: playlist.id,
  libraryId: playlist.libraryId,
  title: playlist.title,
  description: playlist.description,
  videoCount: playlist.videoCount,
  durationSeconds: playlist.durationSeconds,
  createdAt: playlist.createdAt.toISOString(),
  updatedAt: playlist.updatedAt.toISOString(),
})

export const toPlaylistDto = (
  playlist: PlaylistSummary,
  videos: VideoDto[]
): PlaylistDto => ({ ...toPlaylistSummaryDto(playlist), videos })
