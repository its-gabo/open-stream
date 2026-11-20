import { ACTIVITY_ACTIONS } from "@workspace/shared"
import type { ActivityLogService } from "../../activity/services/activity-log.service"
import type {
  ActivityActor,
  ActivityEntry,
} from "../../activity/types/activity.types"
import { diffActivityValues } from "../../activity/utils/activity-changes.utils"
import { DomainError } from "../../common/errors/domain-error"
import type { Transaction } from "../../db/database.types"
import type { PlaylistRecord } from "../../db/schema"
import { toVideoDto } from "../../libraries/dto/libraries.dto.mappers"
import type { LibraryProfile } from "../../libraries/types/libraries.types"
import { libraryActivityContext } from "../../libraries/utils/library-activity.utils"
import {
  toPlaylistDto,
  toPlaylistSummaryDto,
} from "../dto/playlists.dto.mappers"
import type {
  PlaylistCreateBody,
  PlaylistUpdateBody,
  PlaylistVideosUpdateBody,
} from "../dto/playlists.schemas"
import { PLAYLIST_ERRORS } from "../errors/playlists.errors"
import type { PlaylistsRepository } from "../repository/playlists.repository"
import {
  playlistActivityResource,
  toPlaylistActivityValues,
} from "../utils/playlist-activity.utils"

/** A library's playlists, managed by its organization's members or with the library's API key. */
export class PlaylistsService {
  constructor(
    private readonly playlistsRepository: PlaylistsRepository,
    private readonly activityLogService: ActivityLogService
  ) {}

  async listPlaylists(library: LibraryProfile) {
    const playlists = await this.playlistsRepository.listPlaylists(
      library.organizationId,
      library.id
    )

    return { playlists: playlists.map(toPlaylistSummaryDto) }
  }

  async getPlaylist(library: LibraryProfile, playlistId: string) {
    return { playlist: await this.readPlaylistDto(library, playlistId) }
  }

  async createPlaylist(
    library: LibraryProfile,
    actor: ActivityActor,
    input: PlaylistCreateBody
  ) {
    const videoIds = input.videoIds ?? []
    const created = await this.playlistsRepository.transaction(
      async (transaction) => {
        await this.assertVideosOfLibrary(library, videoIds, transaction)

        const playlist = await this.playlistsRepository.insertPlaylist(
          {
            organizationId: library.organizationId,
            libraryId: library.id,
            title: input.title,
            description: input.description ?? null,
            createdById: actor.userId,
          },
          transaction
        )

        await this.playlistsRepository.insertPlaylistItems(
          playlist,
          videoIds,
          transaction
        )
        await this.recordPlaylistChange(
          library,
          actor,
          {
            action: ACTIVITY_ACTIONS.PLAYLIST_CREATED,
            playlist,
            after: { ...toPlaylistActivityValues(playlist), videoIds },
          },
          transaction
        )

        return playlist
      }
    )

    return { playlist: await this.readPlaylistDto(library, created.id) }
  }

  /** Saving the same title and description again changes and records nothing. */
  async updatePlaylist(
    library: LibraryProfile,
    actor: ActivityActor,
    playlistId: string,
    input: PlaylistUpdateBody
  ) {
    await this.playlistsRepository.transaction(async (transaction) => {
      const playlist = await this.lockPlaylist(library, playlistId, transaction)
      const changes = diffActivityValues(toPlaylistActivityValues(playlist), {
        title: input.title ?? playlist.title,
        description:
          input.description === undefined
            ? playlist.description
            : input.description,
      })

      if (!changes) return

      const updated = await this.playlistsRepository.updatePlaylist(
        playlist.id,
        { title: input.title, description: input.description },
        transaction
      )

      if (!updated) throw new DomainError(PLAYLIST_ERRORS.NOT_FOUND)

      await this.recordPlaylistChange(
        library,
        actor,
        {
          action: ACTIVITY_ACTIONS.PLAYLIST_UPDATED,
          playlist: updated,
          ...changes,
        },
        transaction
      )
    })

    return { playlist: await this.readPlaylistDto(library, playlistId) }
  }

  /**
   * Replaces the playlist's videos with `videoIds`, in that order. Videos
   * need not be processed yet; players skip them until they are. Saving the
   * same list again changes and records nothing.
   */
  async updatePlaylistVideos(
    library: LibraryProfile,
    actor: ActivityActor,
    playlistId: string,
    { videoIds }: PlaylistVideosUpdateBody
  ) {
    await this.playlistsRepository.transaction(async (transaction) => {
      const playlist = await this.lockPlaylist(library, playlistId, transaction)
      const changes = diffActivityValues(
        {
          videoIds: await this.playlistsRepository.listPlaylistVideoIds(
            playlist.id,
            transaction
          ),
        },
        { videoIds }
      )

      if (!changes) return

      await this.assertVideosOfLibrary(library, videoIds, transaction)
      await this.playlistsRepository.deletePlaylistItems(
        playlist.id,
        transaction
      )
      await this.playlistsRepository.insertPlaylistItems(
        playlist,
        videoIds,
        transaction
      )
      await this.playlistsRepository.updatePlaylist(
        playlist.id,
        {},
        transaction
      )
      await this.recordPlaylistChange(
        library,
        actor,
        {
          action: ACTIVITY_ACTIONS.PLAYLIST_VIDEOS_UPDATED,
          playlist,
          ...changes,
        },
        transaction
      )
    })

    return { playlist: await this.readPlaylistDto(library, playlistId) }
  }

  /** Deletes the playlist only; its videos stay in the library. */
  async deletePlaylist(
    library: LibraryProfile,
    actor: ActivityActor,
    playlistId: string
  ) {
    await this.playlistsRepository.transaction(async (transaction) => {
      const playlist = await this.lockPlaylist(library, playlistId, transaction)

      await this.playlistsRepository.deletePlaylist(playlist.id, transaction)
      await this.recordPlaylistChange(
        library,
        actor,
        {
          action: ACTIVITY_ACTIONS.PLAYLIST_DELETED,
          playlist,
          before: toPlaylistActivityValues(playlist),
        },
        transaction
      )
    })
  }

  private async readPlaylistDto(library: LibraryProfile, playlistId: string) {
    const playlist = await this.playlistsRepository.findPlaylist({
      organizationId: library.organizationId,
      libraryId: library.id,
      playlistId,
    })

    if (!playlist) throw new DomainError(PLAYLIST_ERRORS.NOT_FOUND)

    const videos = await this.playlistsRepository.listPlaylistVideos(
      playlist.id
    )

    return toPlaylistDto(
      playlist,
      videos.map(({ video, importUrl }) => toVideoDto(video, importUrl))
    )
  }

  private async lockPlaylist(
    library: LibraryProfile,
    playlistId: string,
    transaction: Transaction
  ) {
    const playlist = await this.playlistsRepository.lockPlaylist(
      {
        organizationId: library.organizationId,
        libraryId: library.id,
        playlistId,
      },
      transaction
    )

    if (!playlist) throw new DomainError(PLAYLIST_ERRORS.NOT_FOUND)

    return playlist
  }

  private async assertVideosOfLibrary(
    library: LibraryProfile,
    videoIds: string[],
    transaction: Transaction
  ) {
    const found = await this.playlistsRepository.findLibraryVideoIds(
      library.organizationId,
      library.id,
      videoIds,
      transaction
    )

    if (found.length !== videoIds.length) {
      throw new DomainError(PLAYLIST_ERRORS.VIDEO_NOT_IN_LIBRARY)
    }
  }

  private async recordPlaylistChange(
    library: LibraryProfile,
    actor: ActivityActor,
    {
      action,
      playlist,
      ...changes
    }: Pick<ActivityEntry, "action" | "before" | "after"> & {
      playlist: PlaylistRecord
    },
    transaction: Transaction
  ) {
    await this.activityLogService.recordActivity(
      actor,
      {
        organizationId: library.organizationId,
        action,
        resource: playlistActivityResource(playlist),
        context: libraryActivityContext(library),
        ...changes,
      },
      transaction
    )
  }
}
