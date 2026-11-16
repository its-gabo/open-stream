import { Hono } from "hono"
import { describeRoute } from "hono-openapi"
import { OPENAPI_TAGS } from "../../common/http/openapi/openapi.constants"
import {
  describeApiErrorResponses,
  describeJsonResponse,
} from "../../common/http/openapi/openapi.utils"
import { createApiSuccessResponse } from "../../common/http/response/response.factory"
import { validateRequest } from "../../common/http/validation/validate-request"
import { ORGANIZATION_ROUTE_ERROR_DESCRIPTIONS } from "../constants/organizations-openapi.constants"
import { ORGANIZATION_SUCCESS_RESULTS } from "../dto/organizations.responses"
import {
  organizationDeletionScheduleBodySchema,
  organizationEmptySuccessResponseSchema,
  organizationParamSchema,
  organizationSummarySuccessResponseSchema,
} from "../dto/organizations.schemas"
import {
  requireActiveOrganization,
  requireOrganizationMembership,
  requireOrganizationOwner,
} from "../middleware/organization-access.middleware"
import type { OrganizationDeletionService } from "../services/organization-deletion.service"
import type { OrganizationsService } from "../services/organizations.service"
import type { OrganizationEnv } from "../types/organizations.types"

export function createOrganizationDeletionRouter(
  organizationsService: OrganizationsService,
  organizationDeletionService: OrganizationDeletionService
) {
  const requireMembership = requireOrganizationMembership(organizationsService)

  return new Hono<OrganizationEnv>()
    .post(
      "/:organizationSlug/deletion",
      describeRoute({
        tags: [OPENAPI_TAGS.ORGANIZATIONS],
        operationId: "scheduleOrganizationDeletion",
        summary:
          "Disable the organization now and delete it after the grace period",
        responses: {
          200: describeJsonResponse(
            "Deletion scheduled",
            organizationSummarySuccessResponseSchema
          ),
          ...describeApiErrorResponses(
            ORGANIZATION_ROUTE_ERROR_DESCRIPTIONS.DELETION_SCHEDULE
          ),
        },
      }),
      validateRequest("param", organizationParamSchema),
      validateRequest("json", organizationDeletionScheduleBodySchema),
      requireMembership,
      requireActiveOrganization,
      requireOrganizationOwner,
      async (c) => {
        const scheduled = await organizationDeletionService.scheduleDeletion(
          c.get("organizationAccess"),
          c.get("authSession"),
          c.get("activityActor"),
          c.req.valid("json")
        )

        return c.json(
          createApiSuccessResponse(
            ORGANIZATION_SUCCESS_RESULTS.DELETION_SCHEDULE,
            scheduled
          ),
          200
        )
      }
    )
    .delete(
      "/:organizationSlug/deletion",
      describeRoute({
        tags: [OPENAPI_TAGS.ORGANIZATIONS],
        operationId: "cancelOrganizationDeletion",
        summary:
          "Cancel the scheduled deletion and reactivate the organization",
        responses: {
          200: describeJsonResponse(
            "Deletion canceled",
            organizationEmptySuccessResponseSchema
          ),
          ...describeApiErrorResponses(
            ORGANIZATION_ROUTE_ERROR_DESCRIPTIONS.DELETION_CANCEL
          ),
        },
      }),
      validateRequest("param", organizationParamSchema),
      requireMembership,
      requireOrganizationOwner,
      async (c) => {
        await organizationDeletionService.cancelDeletion(
          c.get("organizationAccess"),
          c.get("authSession"),
          c.get("activityActor")
        )

        return c.json(
          createApiSuccessResponse(
            ORGANIZATION_SUCCESS_RESULTS.DELETION_CANCEL,
            {}
          ),
          200
        )
      }
    )
}
