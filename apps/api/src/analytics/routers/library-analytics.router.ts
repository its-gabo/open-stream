import { Hono } from "hono"
import { describeRoute } from "hono-openapi"
import { OPENAPI_TAGS } from "../../common/http/openapi/openapi.constants"
import {
  describeApiErrorResponses,
  describeJsonResponse,
} from "../../common/http/openapi/openapi.utils"
import { createApiSuccessResponse } from "../../common/http/response/response.factory"
import { validateRequest } from "../../common/http/validation/validate-request"
import { libraryParamSchema } from "../../libraries/dto/libraries.schemas"
import { requireLibrary } from "../../libraries/middleware/library-access.middleware"
import type { LibrariesService } from "../../libraries/services/libraries.service"
import type { LibraryEnv } from "../../libraries/types/libraries.types"
import {
  requireActiveOrganization,
  requireOrganizationMembership,
} from "../../organizations/middleware/organization-access.middleware"
import type { OrganizationsService } from "../../organizations/services/organizations.service"
import { ANALYTICS_ROUTE_ERROR_DESCRIPTIONS } from "../constants/analytics-openapi.constants"
import { ANALYTICS_SUCCESS_RESULTS } from "../dto/analytics.responses"
import {
  analyticsQuerySchema,
  libraryAnalyticsSuccessResponseSchema,
  memberVideoAnalyticsParamSchema,
  videoAnalyticsSuccessResponseSchema,
} from "../dto/analytics.schemas"
import type { VideoAnalyticsService } from "../services/video-analytics.service"

/** Analytics of a library and its videos for every member of its organization. */
export function createLibraryAnalyticsRouter(
  organizationsService: OrganizationsService,
  librariesService: LibrariesService,
  videoAnalyticsService: VideoAnalyticsService
) {
  const requireMemberOfLibrary = [
    requireOrganizationMembership(organizationsService),
    requireActiveOrganization,
    requireLibrary(librariesService),
  ] as const

  return new Hono<LibraryEnv>()
    .get(
      "/:organizationSlug/libraries/:libraryId/analytics",
      describeRoute({
        tags: [OPENAPI_TAGS.ANALYTICS],
        operationId: "getLibraryAnalytics",
        summary: "Read the library's views and watch time over the last `days`",
        responses: {
          200: describeJsonResponse(
            "Library analytics",
            libraryAnalyticsSuccessResponseSchema
          ),
          ...describeApiErrorResponses(
            ANALYTICS_ROUTE_ERROR_DESCRIPTIONS.LIBRARY
          ),
        },
      }),
      validateRequest("param", libraryParamSchema),
      validateRequest("query", analyticsQuerySchema),
      ...requireMemberOfLibrary,
      async (c) =>
        c.json(
          createApiSuccessResponse(
            ANALYTICS_SUCCESS_RESULTS.LIBRARY_GET,
            await videoAnalyticsService.getLibraryAnalytics(
              c.get("library"),
              c.req.valid("query").days
            )
          ),
          200
        )
    )
    .get(
      "/:organizationSlug/libraries/:libraryId/videos/:videoId/analytics",
      describeRoute({
        tags: [OPENAPI_TAGS.ANALYTICS],
        operationId: "getVideoAnalytics",
        summary:
          "Read a video's views, watch time and retention over the last `days`",
        responses: {
          200: describeJsonResponse(
            "Video analytics",
            videoAnalyticsSuccessResponseSchema
          ),
          ...describeApiErrorResponses(
            ANALYTICS_ROUTE_ERROR_DESCRIPTIONS.VIDEO
          ),
        },
      }),
      validateRequest("param", memberVideoAnalyticsParamSchema),
      validateRequest("query", analyticsQuerySchema),
      ...requireMemberOfLibrary,
      async (c) =>
        c.json(
          createApiSuccessResponse(
            ANALYTICS_SUCCESS_RESULTS.VIDEO_GET,
            await videoAnalyticsService.getVideoAnalytics(
              c.get("library"),
              c.req.valid("param").videoId,
              c.req.valid("query").days
            )
          ),
          200
        )
    )
}
