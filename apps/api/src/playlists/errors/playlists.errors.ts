import { DOMAIN_ERROR_KINDS } from "../../common/errors/domain-error.constants"
import type { DomainErrorCatalog } from "../../common/errors/domain-error.types"

export const PLAYLIST_ERROR_CODES = {
  NOT_FOUND: "playlist.not_found",
  VIDEO_NOT_IN_LIBRARY: "playlist.video_not_in_library",
} as const

export const PLAYLIST_ERRORS = {
  NOT_FOUND: {
    kind: DOMAIN_ERROR_KINDS.NOT_FOUND,
    code: PLAYLIST_ERROR_CODES.NOT_FOUND,
    message: "Playlist not found",
    reason: "playlist.inaccessible",
  },
  VIDEO_NOT_IN_LIBRARY: {
    kind: DOMAIN_ERROR_KINDS.INVALID_INPUT,
    code: PLAYLIST_ERROR_CODES.VIDEO_NOT_IN_LIBRARY,
    message: "A playlist can only hold videos of its own library",
    reason: "playlist.video_not_in_library",
  },
} as const satisfies DomainErrorCatalog<typeof PLAYLIST_ERROR_CODES>
