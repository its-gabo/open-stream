import { playlistEmbedPath } from "@workspace/shared"
import type { AppConfig } from "../../config/app.config"
import type { LibraryApiKeyRecord } from "../../db/schema"
import { toLibraryPlayerSettingsDto } from "../../libraries/dto/libraries.dto.mappers"
import type { PlaybackUrlCreateBody } from "../../libraries/dto/libraries.schemas"
import type { VideoPlaybackService } from "../../libraries/services/video-playback.service"
import type {
  LibraryPlaybackRequest,
  LibraryProfile,
} from "../../libraries/types/libraries.types"
import { playlistPlaybackSubject } from "../../libraries/utils/library-api.utils"
import { DomainError } from "../../common/errors/domain-error"
import { PLAYLIST_ERRORS } from "../errors/playlists.errors"
import type { PlaylistsRepository } from "../repository/playlists.repository"

/**
 * Plays playlists in the embeddable player, under the library's playback
 * rules. A signed playlist URL stands for each of its videos: the embed
 * signs every video's URLs with the same key and expiry.
 */
export class PlaylistPlaybackService {
  constructor(
    private readonly playlistsRepository: PlaylistsRepository,
    private readonly videoPlaybackService: VideoPlaybackService,
    private readonly config: AppConfig
  ) {}

  /** An embed URL signed with `apiKey`, valid for `expiresInSeconds`; rolling or deleting the key revokes it. */
  async createPlaybackUrl(
    library: LibraryProfile,
    apiKey: LibraryApiKeyRecord,
    playlistId: string,
    input: PlaybackUrlCreateBody
  ) {
    const playlist = await this.playlistsRepository.findPlaylist({
      organizationId: library.organizationId,
      libraryId: library.id,
      playlistId,
    })

    if (!playlist) throw new DomainError(PLAYLIST_ERRORS.NOT_FOUND)

    const expires = Math.floor(Date.now() / 1000) + input.expiresInSeconds
    const query = this.videoPlaybackService.toSignedQuery(
      library.id,
      playlistPlaybackSubject(playlist.id),
      { apiKey, expires }
    )

    return {
      playback: {
        embedUrl: `${this.config.WEB_ORIGIN}${playlistEmbedPath(library.id, playlist.id)}?${query}`,
        expiresAt: new Date(expires * 1000).toISOString(),
      },
    }
  }

  /**
   * What the embeddable player needs to play a playlist: its processed
   * videos in order, each with URLs of its own. Videos still processing are
   * left out until they are ready.
   */
  async getPlaylistEmbed(
    request: LibraryPlaybackRequest & { playlistId: string }
  ) {
    const { library, signature } =
      await this.videoPlaybackService.authorizeLibraryPlayback(
        request,
        playlistPlaybackSubject(request.playlistId),
        PLAYLIST_ERRORS.NOT_FOUND
      )
    const playlist = await this.playlistsRepository.findPlaylist({
      organizationId: library.organizationId,
      libraryId: library.id,
      playlistId: request.playlistId,
    })

    if (!playlist) throw new DomainError(PLAYLIST_ERRORS.NOT_FOUND)

    const videos = await this.playlistsRepository.listPlaylistVideos(
      playlist.id
    )

    return {
      embed: {
        playlistId: playlist.id,
        title: playlist.title,
        description: playlist.description,
        videos: videos.flatMap(({ video }) => {
          const embeddedVideo = this.videoPlaybackService.toEmbeddedVideo(
            library.id,
            video,
            signature
              ? this.videoPlaybackService.toSignedQuery(
                  library.id,
                  video.id,
                  signature
                )
              : ""
          )

          return embeddedVideo ? [embeddedVideo] : []
        }),
        allowedPlaybackHosts: library.allowedPlaybackHosts,
        player: toLibraryPlayerSettingsDto(library),
      },
    }
  }
}
