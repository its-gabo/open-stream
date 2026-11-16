import { Hono } from "hono"
import { describeRoute } from "hono-openapi"
import type { AuthenticatedEnv } from "../../auth/types/auth.types"
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
  organizationDeletionActionBodySchema,
  organizationEmptySuccessResponseSchema,
} from "../dto/organizations.schemas"
import type { OrganizationDeletionService } from "../services/organization-deletion.service"

/** Targets of the links in the deletion email; the token identifies the organization. */
export function createOrganizationDeletionActionsRouter(
  organizationDeletionService: OrganizationDeletionService
) {
  return new Hono<AuthenticatedEnv>()
    .post(
      "/cancel",
      describeRoute({
        tags: [OPENAPI_TAGS.ORGANIZATIONS],
        operationId: "cancelOrganizationDeletionByToken",
        summary: "Cancel a scheduled deletion with the emailed link",
        responses: {
          200: describeJsonResponse(
            "Deletion canceled",
            organizationEmptySuccessResponseSchema
          ),
          ...describeApiErrorResponses(
            ORGANIZATION_ROUTE_ERROR_DESCRIPTIONS.DELETION_ACTION
          ),
        },
      }),
      validateRequest("json", organizationDeletionActionBodySchema),
      async (c) => {
        await organizationDeletionService.cancelDeletionByToken(
          c.get("authSession"),
          c.get("activityActor"),
          c.req.valid("json").token
        )

        return c.json(
          createApiSuccessResponse(
            ORGANIZATION_SUCCESS_RESULTS.DELETION_ACTION_CANCEL,
            {}
          ),
          200
        )
      }
    )
    .post(
      "/delete",
      describeRoute({
        tags: [OPENAPI_TAGS.ORGANIZATIONS],
        operationId: "deleteOrganizationByToken",
        summary: "Permanently delete a scheduled organization right away",
        responses: {
          200: describeJsonResponse(
            "Organization deleted",
            organizationEmptySuccessResponseSchema
          ),
          ...describeApiErrorResponses(
            ORGANIZATION_ROUTE_ERROR_DESCRIPTIONS.DELETION_ACTION
          ),
        },
      }),
      validateRequest("json", organizationDeletionActionBodySchema),
      async (c) => {
        await organizationDeletionService.deleteOrganizationByToken(
          c.get("authSession"),
          c.get("activityActor"),
          c.req.valid("json").token
        )

        return c.json(
          createApiSuccessResponse(
            ORGANIZATION_SUCCESS_RESULTS.DELETION_ACTION_DELETE,
            {}
          ),
          200
        )
      }
    )
}
