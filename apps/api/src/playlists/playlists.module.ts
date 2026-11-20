import { PlaylistsRepository } from "./repository/playlists.repository"
import { PlaylistPlaybackService } from "./services/playlist-playback.service"
import { PlaylistsService } from "./services/playlists.service"
import type { PlaylistsModuleDependencies } from "./types/playlists.types"

export function createPlaylistsModule({
  db,
  config,
  activityLogService,
  videoPlaybackService,
}: PlaylistsModuleDependencies) {
  const playlistsRepository = new PlaylistsRepository(db)

  return {
    playlistsService: new PlaylistsService(
      playlistsRepository,
      activityLogService
    ),
    playlistPlaybackService: new PlaylistPlaybackService(
      playlistsRepository,
      videoPlaybackService,
      config
    ),
  }
}

export type PlaylistsModule = ReturnType<typeof createPlaylistsModule>
