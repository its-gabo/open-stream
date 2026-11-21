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
  libraryParamSchema,
  videoParamSchema,
} from "../../libraries/dto/libraries.schemas"
import { requireLibrary } from "../../libraries/middleware/library-access.middleware"
import type { LibrariesService } from "../../libraries/services/libraries.service"
import type { LibraryEnv } from "../../libraries/types/libraries.types"
import {
  requireActiveOrganization,
  requireOrganizationMembership,
  requireOrganizationOwner,
} from "../../organizations/middleware/organization-access.middleware"
import type { OrganizationsService } from "../../organizations/services/organizations.service"
import { CHAPTER_GENERATION_ROUTE_ERROR_DESCRIPTIONS } from "../constants/chapter-generation-openapi.constants"
import { CHAPTER_GENERATION_SUCCESS_RESULTS } from "../dto/chapter-generation.responses"
import {
  libraryChapterGenerationSettingsSuccessResponseSchema,
  libraryChapterGenerationUpdateBodySchema,
  videoChapterSuggestionRequestBodySchema,
  videoChapterSuggestionsSuccessResponseSchema,
} from "../dto/chapter-generation.schemas"
import type { LibraryChapterGenerationSettingsService } from "../services/library-chapter-generation-settings.service"
import type { VideoChapterSuggestionsService } from "../services/video-chapter-suggestions.service"

/**
 * Chapters proposed from a video's captions, which every member of the
 * active organization may ask for, and the library's choice of provider,
 * which only the owner changes.
 */
export function createVideoChapterGenerationRouter(
  organizationsService: OrganizationsService,
  librariesService: LibrariesService,
  videoChapterSuggestionsService: VideoChapterSuggestionsService,
  libraryChapterGenerationSettingsService: LibraryChapterGenerationSettingsService
) {
  const requireMemberOfLibrary = [
    requireOrganizationMembership(organizationsService),
    requireActiveOrganization,
    requireLibrary(librariesService),
  ] as const
  const requireOwnerOfLibrary = [
    requireOrganizationMembership(organizationsService),
    requireActiveOrganization,
    requireOrganizationOwner,
    requireLibrary(librariesService),
  ] as const

  return new Hono<LibraryEnv>()
    .post(
      "/:organizationSlug/libraries/:libraryId/videos/:videoId/chapter-suggestions",
      describeRoute({
        tags: [OPENAPI_TAGS.LIBRARIES],
        operationId: "suggestVideoChapters",
        summary:
          "Propose a processed video's chapters from one of its caption tracks with the library's provider; nothing is saved",
        responses: {
          200: describeJsonResponse(
            "Chapters suggested",
            videoChapterSuggestionsSuccessResponseSchema
          ),
          ...describeApiErrorResponses(
            CHAPTER_GENERATION_ROUTE_ERROR_DESCRIPTIONS.SUGGEST
          ),
        },
      }),
      validateRequest("param", videoParamSchema),
      validateRequest("json", videoChapterSuggestionRequestBodySchema),
      ...requireMemberOfLibrary,
      async (c) =>
        c.json(
          createApiSuccessResponse(
            CHAPTER_GENERATION_SUCCESS_RESULTS.SUGGESTIONS,
            await videoChapterSuggestionsService.suggestChapters(
              c.get("library"),
              c.get("activityActor"),
              c.req.valid("param").videoId,
              c.req.valid("json"),
              c.req.raw.signal
            )
          ),
          200
        )
    )
    .get(
      "/:organizationSlug/libraries/:libraryId/chapter-generation",
      describeRoute({
        tags: [OPENAPI_TAGS.LIBRARIES],
        operationId: "getLibraryChapterGenerationSettings",
        summary: "Read which provider writes chapters for the library's videos",
        responses: {
          200: describeJsonResponse(
            "Chapter generation settings",
            libraryChapterGenerationSettingsSuccessResponseSchema
          ),
          ...describeApiErrorResponses(
            CHAPTER_GENERATION_ROUTE_ERROR_DESCRIPTIONS.SETTINGS_GET
          ),
        },
      }),
      validateRequest("param", libraryParamSchema),
      ...requireOwnerOfLibrary,
      async (c) =>
        c.json(
          createApiSuccessResponse(
            CHAPTER_GENERATION_SUCCESS_RESULTS.LIBRARY_SETTINGS_GET,
            await libraryChapterGenerationSettingsService.getLibraryChapterGeneration(
              c.get("library")
            )
          ),
          200
        )
    )
    .put(
      "/:organizationSlug/libraries/:libraryId/chapter-generation",
      describeRoute({
        tags: [OPENAPI_TAGS.LIBRARIES],
        operationId: "updateLibraryChapterGenerationSettings",
        summary:
          "Choose the organization's provider that writes chapters for the library's videos, or none",
        responses: {
          200: describeJsonResponse(
            "Chapter generation settings saved",
            libraryChapterGenerationSettingsSuccessResponseSchema
          ),
          ...describeApiErrorResponses(
            CHAPTER_GENERATION_ROUTE_ERROR_DESCRIPTIONS.SETTINGS_UPDATE
          ),
        },
      }),
      validateRequest("param", libraryParamSchema),
      validateRequest("json", libraryChapterGenerationUpdateBodySchema),
      ...requireOwnerOfLibrary,
      async (c) =>
        c.json(
          createApiSuccessResponse(
            CHAPTER_GENERATION_SUCCESS_RESULTS.LIBRARY_SETTINGS_UPDATE,
            await libraryChapterGenerationSettingsService.updateLibraryChapterGeneration(
              c.get("library"),
              c.get("activityActor"),
              c.req.valid("json")
            )
          ),
          200
        )
    )
}
