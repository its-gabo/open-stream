import { Hono } from "hono"
import { describeRoute } from "hono-openapi"
import { OPENAPI_TAGS } from "../../common/http/openapi/openapi.constants"
import {
  describeApiErrorResponses,
  describeJsonResponse,
} from "../../common/http/openapi/openapi.utils"
import { createApiSuccessResponse } from "../../common/http/response/response.factory"
import { validateRequest } from "../../common/http/validation/validate-request"
import { playbackQuerySchema } from "../../libraries/dto/libraries.schemas"
import { toLibraryPlaybackRequest } from "../../libraries/utils/video-playback-http.utils"
import { PLAYLIST_ROUTE_ERROR_DESCRIPTIONS } from "../constants/playlists-openapi.constants"
import { PLAYLIST_SUCCESS_RESULTS } from "../dto/playlists.responses"
import {
  playlistEmbedSuccessResponseSchema,
  publicPlaylistParamSchema,
} from "../dto/playlists.schemas"
import type { PlaylistPlaybackService } from "../services/playlist-playback.service"

/** Plays playlists without an API key, under the library's playback rules, like single videos. */
export function createPlaylistPlaybackRouter(
  playlistPlaybackService: PlaylistPlaybackService
) {
  return new Hono().get(
    "/:libraryId/playlists/:playlistId/embed",
    describeRoute({
      tags: [OPENAPI_TAGS.LIBRARY_API],
      operationId: "getLibraryApiPlaylistEmbed",
      summary:
        "Read what the embeddable player needs to play a playlist; the `Referer` is the page that frames it, and signed libraries need the playlist's `key`, `expires` and `token`",
      responses: {
        200: describeJsonResponse(
          "Playlist embed",
          playlistEmbedSuccessResponseSchema
        ),
        ...describeApiErrorResponses(PLAYLIST_ROUTE_ERROR_DESCRIPTIONS.EMBED),
      },
    }),
    validateRequest("param", publicPlaylistParamSchema),
    validateRequest("query", playbackQuerySchema),
    async (c) => {
      const { libraryId, playlistId } = c.req.valid("param")

      return c.json(
        createApiSuccessResponse(
          PLAYLIST_SUCCESS_RESULTS.EMBED_GET,
          await playlistPlaybackService.getPlaylistEmbed({
            ...toLibraryPlaybackRequest(c.req, libraryId),
            playlistId,
          })
        ),
        200
      )
    }
  )
}
