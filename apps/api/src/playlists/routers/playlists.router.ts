import { Hono } from "hono"
import { describeRoute } from "hono-openapi"
import { OPENAPI_TAGS } from "../../common/http/openapi/openapi.constants"
import {
  describeApiErrorResponses,
  describeJsonResponse,
} from "../../common/http/openapi/openapi.utils"
import { createApiSuccessResponse } from "../../common/http/response/response.factory"
import { validateRequest } from "../../common/http/validation/validate-request"
import {
  libraryEmptySuccessResponseSchema,
  libraryParamSchema,
} from "../../libraries/dto/libraries.schemas"
import { requireLibrary } from "../../libraries/middleware/library-access.middleware"
import type { LibrariesService } from "../../libraries/services/libraries.service"
import type { LibraryEnv } from "../../libraries/types/libraries.types"
import {
  requireActiveOrganization,
  requireOrganizationMembership,
} from "../../organizations/middleware/organization-access.middleware"
import type { OrganizationsService } from "../../organizations/services/organizations.service"
import { PLAYLIST_ROUTE_ERROR_DESCRIPTIONS } from "../constants/playlists-openapi.constants"
import { PLAYLIST_SUCCESS_RESULTS } from "../dto/playlists.responses"
import {
  playlistCreateBodySchema,
  playlistListSuccessResponseSchema,
  playlistParamSchema,
  playlistSuccessResponseSchema,
  playlistUpdateBodySchema,
  playlistVideosUpdateBodySchema,
} from "../dto/playlists.schemas"
import type { PlaylistsService } from "../services/playlists.service"

/** Playlists of a library; every member of the active organization manages them. */
export function createPlaylistsRouter(
  organizationsService: OrganizationsService,
  librariesService: LibrariesService,
  playlistsService: PlaylistsService
) {
  const requireMemberOfLibrary = [
    requireOrganizationMembership(organizationsService),
    requireActiveOrganization,
    requireLibrary(librariesService),
  ] as const

  return new Hono<LibraryEnv>()
    .get(
      "/:organizationSlug/libraries/:libraryId/playlists",
      describeRoute({
        tags: [OPENAPI_TAGS.LIBRARIES],
        operationId: "listPlaylists",
        summary: "List the library's playlists, newest first",
        responses: {
          200: describeJsonResponse(
            "Playlists",
            playlistListSuccessResponseSchema
          ),
          ...describeApiErrorResponses(PLAYLIST_ROUTE_ERROR_DESCRIPTIONS.LIST),
        },
      }),
      validateRequest("param", libraryParamSchema),
      ...requireMemberOfLibrary,
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
      "/:organizationSlug/libraries/:libraryId/playlists",
      describeRoute({
        tags: [OPENAPI_TAGS.LIBRARIES],
        operationId: "createPlaylist",
        summary: "Create a playlist, empty or with videos of the library",
        responses: {
          201: describeJsonResponse(
            "Playlist created",
            playlistSuccessResponseSchema
          ),
          ...describeApiErrorResponses(
            PLAYLIST_ROUTE_ERROR_DESCRIPTIONS.CREATE
          ),
        },
      }),
      validateRequest("param", libraryParamSchema),
      validateRequest("json", playlistCreateBodySchema),
      ...requireMemberOfLibrary,
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
      "/:organizationSlug/libraries/:libraryId/playlists/:playlistId",
      describeRoute({
        tags: [OPENAPI_TAGS.LIBRARIES],
        operationId: "getPlaylist",
        summary: "Read a playlist and its videos in playback order",
        responses: {
          200: describeJsonResponse("Playlist", playlistSuccessResponseSchema),
          ...describeApiErrorResponses(PLAYLIST_ROUTE_ERROR_DESCRIPTIONS.GET),
        },
      }),
      validateRequest("param", playlistParamSchema),
      ...requireMemberOfLibrary,
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
      "/:organizationSlug/libraries/:libraryId/playlists/:playlistId",
      describeRoute({
        tags: [OPENAPI_TAGS.LIBRARIES],
        operationId: "updatePlaylist",
        summary: "Change a playlist's title or description",
        responses: {
          200: describeJsonResponse(
            "Playlist saved",
            playlistSuccessResponseSchema
          ),
          ...describeApiErrorResponses(PLAYLIST_ROUTE_ERROR_DESCRIPTIONS.WRITE),
        },
      }),
      validateRequest("param", playlistParamSchema),
      validateRequest("json", playlistUpdateBodySchema),
      ...requireMemberOfLibrary,
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
      "/:organizationSlug/libraries/:libraryId/playlists/:playlistId/videos",
      describeRoute({
        tags: [OPENAPI_TAGS.LIBRARIES],
        operationId: "updatePlaylistVideos",
        summary:
          "Replace a playlist's videos, in playback order; an empty list removes them",
        responses: {
          200: describeJsonResponse(
            "Playlist videos saved",
            playlistSuccessResponseSchema
          ),
          ...describeApiErrorResponses(PLAYLIST_ROUTE_ERROR_DESCRIPTIONS.WRITE),
        },
      }),
      validateRequest("param", playlistParamSchema),
      validateRequest("json", playlistVideosUpdateBodySchema),
      ...requireMemberOfLibrary,
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
      "/:organizationSlug/libraries/:libraryId/playlists/:playlistId",
      describeRoute({
        tags: [OPENAPI_TAGS.LIBRARIES],
        operationId: "deletePlaylist",
        summary: "Delete a playlist; its videos stay in the library",
        responses: {
          200: describeJsonResponse(
            "Playlist deleted",
            libraryEmptySuccessResponseSchema
          ),
          ...describeApiErrorResponses(PLAYLIST_ROUTE_ERROR_DESCRIPTIONS.WRITE),
        },
      }),
      validateRequest("param", playlistParamSchema),
      ...requireMemberOfLibrary,
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
}
