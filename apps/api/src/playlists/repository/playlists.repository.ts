import { and, asc, desc, eq, inArray } from "drizzle-orm"
import type { Database, Transaction } from "../../db/database.types"
import {
  playlistItems,
  playlists,
  videoImports,
  videos,
  type NewPlaylistRecord,
} from "../../db/schema"
import type { PlaylistScope, PlaylistSummary } from "../types/playlists.types"
import {
  playlistInScope,
  playlistSummaryColumns,
} from "../utils/playlist-query.utils"

export class PlaylistsRepository {
  constructor(private readonly db: Database) {}

  transaction<T>(work: (transaction: Transaction) => Promise<T>) {
    return this.db.transaction(work)
  }

  /** Newest first. */
  listPlaylists(
    organizationId: string,
    libraryId: string
  ): Promise<PlaylistSummary[]> {
    return this.selectPlaylistSummaries()
      .where(
        and(
          eq(playlists.organizationId, organizationId),
          eq(playlists.libraryId, libraryId)
        )
      )
      .groupBy(playlists.id)
      .orderBy(desc(playlists.createdAt), desc(playlists.id))
  }

  async findPlaylist(scope: PlaylistScope): Promise<PlaylistSummary | null> {
    const [playlist] = await this.selectPlaylistSummaries()
      .where(playlistInScope(scope))
      .groupBy(playlists.id)

    return playlist ?? null
  }

  /** Taken before a playlist's videos change, so concurrent changes apply one after another. */
  async lockPlaylist(scope: PlaylistScope, transaction: Transaction) {
    const [playlist] = await transaction
      .select()
      .from(playlists)
      .where(playlistInScope(scope))
      .for("update")

    return playlist ?? null
  }

  /** The playlist's videos in playback order, with the URL each is imported from, if any. */
  listPlaylistVideos(playlistId: string) {
    return this.db
      .select({ video: videos, importUrl: videoImports.url })
      .from(playlistItems)
      .innerJoin(videos, eq(videos.id, playlistItems.videoId))
      .leftJoin(videoImports, eq(videoImports.videoId, videos.id))
      .where(eq(playlistItems.playlistId, playlistId))
      .orderBy(asc(playlistItems.position))
  }

  async listPlaylistVideoIds(playlistId: string, transaction: Transaction) {
    const items = await transaction
      .select({ videoId: playlistItems.videoId })
      .from(playlistItems)
      .where(eq(playlistItems.playlistId, playlistId))
      .orderBy(asc(playlistItems.position))

    return items.map(({ videoId }) => videoId)
  }

  /** Those of `videoIds` that are videos of the library, kept from being deleted until the transaction ends. */
  async findLibraryVideoIds(
    organizationId: string,
    libraryId: string,
    videoIds: string[],
    transaction: Transaction
  ) {
    if (videoIds.length === 0) return []

    const found = await transaction
      .select({ id: videos.id })
      .from(videos)
      .where(
        and(
          eq(videos.organizationId, organizationId),
          eq(videos.libraryId, libraryId),
          inArray(videos.id, videoIds)
        )
      )
      .for("share")

    return found.map(({ id }) => id)
  }

  async insertPlaylist(playlist: NewPlaylistRecord, transaction: Transaction) {
    const [created] = await transaction
      .insert(playlists)
      .values(playlist)
      .returning()

    return created!
  }

  async updatePlaylist(
    playlistId: string,
    changes: Partial<Pick<NewPlaylistRecord, "title" | "description">>,
    transaction: Transaction
  ) {
    const [playlist] = await transaction
      .update(playlists)
      .set({ ...changes, updatedAt: new Date() })
      .where(eq(playlists.id, playlistId))
      .returning()

    return playlist ?? null
  }

  async deletePlaylist(playlistId: string, transaction: Transaction) {
    await transaction.delete(playlists).where(eq(playlists.id, playlistId))
  }

  async deletePlaylistItems(playlistId: string, transaction: Transaction) {
    await transaction
      .delete(playlistItems)
      .where(eq(playlistItems.playlistId, playlistId))
  }

  /** Adds the videos at positions 0, 1, … in the order given; the playlist must have none yet. */
  async insertPlaylistItems(
    playlist: Pick<PlaylistScope, "organizationId" | "libraryId"> & {
      id: string
    },
    videoIds: string[],
    transaction: Transaction
  ) {
    if (videoIds.length === 0) return

    await transaction.insert(playlistItems).values(
      videoIds.map((videoId, position) => ({
        playlistId: playlist.id,
        videoId,
        organizationId: playlist.organizationId,
        libraryId: playlist.libraryId,
        position,
      }))
    )
  }

  private selectPlaylistSummaries() {
    return this.db
      .select(playlistSummaryColumns)
      .from(playlists)
      .leftJoin(playlistItems, eq(playlistItems.playlistId, playlists.id))
      .leftJoin(videos, eq(videos.id, playlistItems.videoId))
  }
}
