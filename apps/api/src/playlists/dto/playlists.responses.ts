import type { ApiResultCatalog } from "../../common/http/response/response.types"

export const PLAYLIST_SUCCESS_CODES = {
  LIST: "playlist.list.success",
  CREATE: "playlist.create.success",
  GET: "playlist.get.success",
  UPDATE: "playlist.update.success",
  VIDEOS_UPDATE: "playlist.videos.update.success",
  DELETE: "playlist.delete.success",
  PLAYBACK_URL_CREATE: "playlist.playback_url.create.success",
  EMBED_GET: "playlist.embed.get.success",
} as const

export const PLAYLIST_SUCCESS_RESULTS = {
  LIST: {
    code: PLAYLIST_SUCCESS_CODES.LIST,
    message: "Playlists fetched.",
  },
  CREATE: {
    code: PLAYLIST_SUCCESS_CODES.CREATE,
    message: "Playlist created.",
  },
  GET: {
    code: PLAYLIST_SUCCESS_CODES.GET,
    message: "Playlist fetched.",
  },
  UPDATE: {
    code: PLAYLIST_SUCCESS_CODES.UPDATE,
    message: "Playlist saved.",
  },
  VIDEOS_UPDATE: {
    code: PLAYLIST_SUCCESS_CODES.VIDEOS_UPDATE,
    message: "Playlist videos saved.",
  },
  DELETE: {
    code: PLAYLIST_SUCCESS_CODES.DELETE,
    message: "Playlist deleted.",
  },
  PLAYBACK_URL_CREATE: {
    code: PLAYLIST_SUCCESS_CODES.PLAYBACK_URL_CREATE,
    message: "Playlist playback URL created.",
  },
  EMBED_GET: {
    code: PLAYLIST_SUCCESS_CODES.EMBED_GET,
    message: "Playlist embed fetched.",
  },
} as const satisfies ApiResultCatalog<typeof PLAYLIST_SUCCESS_CODES>
