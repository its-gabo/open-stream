import { Hono } from "hono"
import { describeRoute } from "hono-openapi"
import { OPENAPI_TAGS } from "../../common/http/openapi/openapi.constants"
import {
  describeApiErrorResponses,
  describeJsonResponse,
} from "../../common/http/openapi/openapi.utils"
import { createApiSuccessResponse } from "../../common/http/response/response.factory"
import { validateRequest } from "../../common/http/validation/validate-request"
import { organizationParamSchema } from "../../organizations/dto/organizations.schemas"
import {
  requireActiveOrganization,
  requireOrganizationMembership,
} from "../../organizations/middleware/organization-access.middleware"
import type { OrganizationsService } from "../../organizations/services/organizations.service"
import type { OrganizationEnv } from "../../organizations/types/organizations.types"
import { ANALYTICS_ROUTE_ERROR_DESCRIPTIONS } from "../constants/analytics-openapi.constants"
import { ANALYTICS_SUCCESS_RESULTS } from "../dto/analytics.responses"
import {
  analyticsQuerySchema,
  organizationAnalyticsSuccessResponseSchema,
} from "../dto/analytics.schemas"
import type { VideoAnalyticsService } from "../services/video-analytics.service"

/** Analytics of every library of an organization together, for each of its members. */
export function createOrganizationAnalyticsRouter(
  organizationsService: OrganizationsService,
  videoAnalyticsService: VideoAnalyticsService
) {
  return new Hono<OrganizationEnv>().get(
    "/:organizationSlug/analytics",
    describeRoute({
      tags: [OPENAPI_TAGS.ANALYTICS],
      operationId: "getOrganizationAnalytics",
      summary:
        "Read the views and watch time of all the organization's libraries over the last `days`",
      responses: {
        200: describeJsonResponse(
          "Organization analytics",
          organizationAnalyticsSuccessResponseSchema
        ),
        ...describeApiErrorResponses(
          ANALYTICS_ROUTE_ERROR_DESCRIPTIONS.ORGANIZATION
        ),
      },
    }),
    validateRequest("param", organizationParamSchema),
    validateRequest("query", analyticsQuerySchema),
    requireOrganizationMembership(organizationsService),
    requireActiveOrganization,
    async (c) =>
      c.json(
        createApiSuccessResponse(
          ANALYTICS_SUCCESS_RESULTS.ORGANIZATION_GET,
          await videoAnalyticsService.getOrganizationAnalytics(
            c.get("organizationAccess").organization.id,
            c.req.valid("query").days
          )
        ),
        200
      )
  )
}
