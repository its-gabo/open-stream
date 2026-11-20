import {
  LIBRARY_API_KEY_SCOPES,
  type LibraryApiKeyScope,
} from "@workspace/shared"
import { Hono } from "hono"
import { describeRoute } from "hono-openapi"
import { OPENAPI_TAGS } from "../../common/http/openapi/openapi.constants"
import {
  describeApiErrorResponses,
  describeJsonResponse,
} from "../../common/http/openapi/openapi.utils"
import { createApiSuccessResponse } from "../../common/http/response/response.factory"
import { validateRequest } from "../../common/http/validation/validate-request"
import { API_KEY_SECURITY } from "../../libraries/constants/libraries-openapi.constants"
import {
  libraryEmptySuccessResponseSchema,
  playbackUrlCreateBodySchema,
  publicLibraryParamSchema,
} from "../../libraries/dto/libraries.schemas"
import { requireLibraryApiKey } from "../../libraries/middleware/library-api-key.middleware"
import type { LibraryApiAccessService } from "../../libraries/services/library-api-access.service"
import type { LibraryApiEnv } from "../../libraries/types/libraries.types"
import { PLAYLIST_ROUTE_ERROR_DESCRIPTIONS } from "../constants/playlists-openapi.constants"
import { PLAYLIST_SUCCESS_RESULTS } from "../dto/playlists.responses"
import {
  playlistCreateBodySchema,
  playlistListSuccessResponseSchema,
  playlistPlaybackUrlSuccessResponseSchema,
  playlistSuccessResponseSchema,
  playlistUpdateBodySchema,
  playlistVideosUpdateBodySchema,
  publicPlaylistParamSchema,
} from "../dto/playlists.schemas"
import type { PlaylistPlaybackService } from "../services/playlist-playback.service"
import type { PlaylistsService } from "../services/playlists.service"

/** The library's playlists, managed from the customer's own servers with an API key holding each route's scope. */
export function createLibraryApiPlaylistsRouter(
  libraryApiAccessService: LibraryApiAccessService,
  playlistsService: PlaylistsService,
  playlistPlaybackService: PlaylistPlaybackService
) {
  const requireScope = (scope: LibraryApiKeyScope) =>
    requireLibraryApiKey(libraryApiAccessService, scope)

  return new Hono<LibraryApiEnv>()
    .get(
      "/:libraryId/playlists",
      describeRoute({
        tags: [OPENAPI_TAGS.LIBRARY_API],
        security: API_KEY_SECURITY,
        operationId: "listLibraryApiPlaylists",
        description: "Needs the `videos:read` scope.",
        summary: "List the library's playlists, newest first",
        responses: {
          200: describeJsonResponse(
            "Playlists",
            playlistListSuccessResponseSchema
          ),
          ...describeApiErrorResponses(
            PLAYLIST_ROUTE_ERROR_DESCRIPTIONS.API_LIST
          ),
        },
      }),
      validateRequest("param", publicLibraryParamSchema),
      requireScope(LIBRARY_API_KEY_SCOPES.VIDEOS_READ),
      async (c) =>
        c.json(
          createApiSuccessResponse(
            PLAYLIST_SUCCESS_RESULTS.LIST,
            await playlistsService.listPlaylists(c.get("library"))
          ),
          200
        )
    )
    .post(
      "/:libraryId/playlists",
      describeRoute({
        tags: [OPENAPI_TAGS.LIBRARY_API],
        security: API_KEY_SECURITY,
        operationId: "createLibraryApiPlaylist",
        description: "Needs the `videos:manage` scope.",
        summary: "Create a playlist, empty or with videos of the library",
        responses: {
          201: describeJsonResponse(
            "Playlist created",
            playlistSuccessResponseSchema
          ),
          ...describeApiErrorResponses(
            PLAYLIST_ROUTE_ERROR_DESCRIPTIONS.API_CREATE
          ),
        },
      }),
      validateRequest("param", publicLibraryParamSchema),
      validateRequest("json", playlistCreateBodySchema),
      requireScope(LIBRARY_API_KEY_SCOPES.VIDEOS_MANAGE),
      async (c) =>
        c.json(
          createApiSuccessResponse(
            PLAYLIST_SUCCESS_RESULTS.CREATE,
            await playlistsService.createPlaylist(
              c.get("library"),
              c.get("activityActor"),
              c.req.valid("json")
            )
          ),
          201
        )
    )
    .get(
      "/:libraryId/playlists/:playlistId",
      describeRoute({
        tags: [OPENAPI_TAGS.LIBRARY_API],
        security: API_KEY_SECURITY,
        operationId: "getLibraryApiPlaylist",
        description: "Needs the `videos:read` scope.",
        summary: "Read a playlist and its videos in playback order",
        responses: {
          200: describeJsonResponse("Playlist", playlistSuccessResponseSchema),
          ...describeApiErrorResponses(
            PLAYLIST_ROUTE_ERROR_DESCRIPTIONS.API_PLAYLIST
          ),
        },
      }),
      validateRequest("param", publicPlaylistParamSchema),
      requireScope(LIBRARY_API_KEY_SCOPES.VIDEOS_READ),
      async (c) =>
        c.json(
          createApiSuccessResponse(
            PLAYLIST_SUCCESS_RESULTS.GET,
            await playlistsService.getPlaylist(
              c.get("library"),
              c.req.valid("param").playlistId
            )
          ),
          200
        )
    )
    .patch(
      "/:libraryId/playlists/:playlistId",
      describeRoute({
        tags: [OPENAPI_TAGS.LIBRARY_API],
        security: API_KEY_SECURITY,
        operationId: "updateLibraryApiPlaylist",
        description: "Needs the `videos:manage` scope.",
        summary: "Change a playlist's title or description",
        responses: {
          200: describeJsonResponse(
            "Playlist saved",
            playlistSuccessResponseSchema
          ),
          ...describeApiErrorResponses(
            PLAYLIST_ROUTE_ERROR_DESCRIPTIONS.API_PLAYLIST
          ),
        },
      }),
      validateRequest("param", publicPlaylistParamSchema),
      validateRequest("json", playlistUpdateBodySchema),
      requireScope(LIBRARY_API_KEY_SCOPES.VIDEOS_MANAGE),
      async (c) =>
        c.json(
          createApiSuccessResponse(
            PLAYLIST_SUCCESS_RESULTS.UPDATE,
            await playlistsService.updatePlaylist(
              c.get("library"),
              c.get("activityActor"),
              c.req.valid("param").playlistId,
              c.req.valid("json")
            )
          ),
          200
        )
    )
    .put(
      "/:libraryId/playlists/:playlistId/videos",
      describeRoute({
        tags: [OPENAPI_TAGS.LIBRARY_API],
        security: API_KEY_SECURITY,
        operationId: "updateLibraryApiPlaylistVideos",
        description: "Needs the `videos:manage` scope.",
        summary:
          "Replace a playlist's videos, in playback order; an empty list removes them",
        responses: {
          200: describeJsonResponse(
            "Playlist videos saved",
            playlistSuccessResponseSchema
          ),
          ...describeApiErrorResponses(
            PLAYLIST_ROUTE_ERROR_DESCRIPTIONS.API_PLAYLIST
          ),
        },
      }),
      validateRequest("param", publicPlaylistParamSchema),
      validateRequest("json", playlistVideosUpdateBodySchema),
      requireScope(LIBRARY_API_KEY_SCOPES.VIDEOS_MANAGE),
      async (c) =>
        c.json(
          createApiSuccessResponse(
            PLAYLIST_SUCCESS_RESULTS.VIDEOS_UPDATE,
            await playlistsService.updatePlaylistVideos(
              c.get("library"),
              c.get("activityActor"),
              c.req.valid("param").playlistId,
              c.req.valid("json")
            )
          ),
          200
        )
    )
    .delete(
      "/:libraryId/playlists/:playlistId",
      describeRoute({
        tags: [OPENAPI_TAGS.LIBRARY_API],
        security: API_KEY_SECURITY,
        operationId: "deleteLibraryApiPlaylist",
        description: "Needs the `videos:manage` scope.",
        summary: "Delete a playlist; its videos stay in the library",
        responses: {
          200: describeJsonResponse(
            "Playlist deleted",
            libraryEmptySuccessResponseSchema
          ),
          ...describeApiErrorResponses(
            PLAYLIST_ROUTE_ERROR_DESCRIPTIONS.API_PLAYLIST
          ),
        },
      }),
      validateRequest("param", publicPlaylistParamSchema),
      requireScope(LIBRARY_API_KEY_SCOPES.VIDEOS_MANAGE),
      async (c) => {
        await playlistsService.deletePlaylist(
          c.get("library"),
          c.get("activityActor"),
          c.req.valid("param").playlistId
        )

        return c.json(
          createApiSuccessResponse(PLAYLIST_SUCCESS_RESULTS.DELETE, {}),
          200
        )
      }
    )
    .post(
      "/:libraryId/playlists/:playlistId/playback-urls",
      describeRoute({
        tags: [OPENAPI_TAGS.LIBRARY_API],
        security: API_KEY_SECURITY,
        operationId: "createLibraryApiPlaylistPlaybackUrl",
        description: "Needs the `playback:sign` scope.",
        summary:
          "Sign a playlist embed URL that expires; required when the library only allows signed playback",
        responses: {
          201: describeJsonResponse(
            "Playlist playback URL created",
            playlistPlaybackUrlSuccessResponseSchema
          ),
          ...describeApiErrorResponses(
            PLAYLIST_ROUTE_ERROR_DESCRIPTIONS.API_PLAYLIST
          ),
        },
      }),
      validateRequest("param", publicPlaylistParamSchema),
      validateRequest("json", playbackUrlCreateBodySchema),
      requireScope(LIBRARY_API_KEY_SCOPES.PLAYBACK_SIGN),
      async (c) =>
        c.json(
          createApiSuccessResponse(
            PLAYLIST_SUCCESS_RESULTS.PLAYBACK_URL_CREATE,
            await playlistPlaybackService.createPlaybackUrl(
              c.get("library"),
              c.get("apiKey"),
              c.req.valid("param").playlistId,
              c.req.valid("json")
            )
          ),
          201
        )
    )
}
