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
  requireOrganizationMembership,
  requireOrganizationOwner,
} from "../../organizations/middleware/organization-access.middleware"
import type { OrganizationsService } from "../../organizations/services/organizations.service"
import type { OrganizationEnv } from "../../organizations/types/organizations.types"
import { ACTIVITY_ROUTE_ERROR_DESCRIPTIONS } from "../constants/activity-openapi.constants"
import { ACTIVITY_SUCCESS_RESULTS } from "../dto/activity.responses"
import {
  activityListQuerySchema,
  activityLogPageSuccessResponseSchema,
} from "../dto/activity.schemas"
import type { ActivityLogService } from "../services/activity-log.service"

/** The organization's activity log; owner-only. */
export function createActivityCoreRouter(
  organizationsService: OrganizationsService,
  activityLogService: ActivityLogService
) {
  return new Hono<OrganizationEnv>().get(
    "/:organizationSlug/activity",
    describeRoute({
      tags: [OPENAPI_TAGS.ACTIVITY],
      operationId: "listOrganizationActivity",
      summary:
        "List who changed what in the organization, newest first, a page at a time; readable while it is pending deletion",
      responses: {
        200: describeJsonResponse(
          "Activity",
          activityLogPageSuccessResponseSchema
        ),
        ...describeApiErrorResponses(ACTIVITY_ROUTE_ERROR_DESCRIPTIONS.LIST),
      },
    }),
    validateRequest("param", organizationParamSchema),
    validateRequest("query", activityListQuerySchema),
    requireOrganizationMembership(organizationsService),
    // Readable while the organization is pending deletion, when it matters most.
    requireOrganizationOwner,
    async (c) => {
      const activity = await activityLogService.listActivity(
        c.get("organizationAccess"),
        c.req.valid("query")
      )

      return c.json(
        createApiSuccessResponse(ACTIVITY_SUCCESS_RESULTS.LIST, activity),
        200
      )
    }
  )
}
