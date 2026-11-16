import { Hono } from "hono"
import { describeRoute } from "hono-openapi"
import type { AuthenticatedEnv } from "../../auth/types/auth.types"
import { OPENAPI_TAGS } from "../../common/http/openapi/openapi.constants"
import {
  describeApiErrorResponses,
  describeJsonResponse,
} from "../../common/http/openapi/openapi.utils"
import { paginationQuerySchema } from "../../common/http/pagination/pagination.schemas"
import { createApiSuccessResponse } from "../../common/http/response/response.factory"
import { validateRequest } from "../../common/http/validation/validate-request"
import { ACTIVITY_ROUTE_ERROR_DESCRIPTIONS } from "../constants/activity-openapi.constants"
import { ACTIVITY_SUCCESS_RESULTS } from "../dto/activity.responses"
import { activityLogPageSuccessResponseSchema } from "../dto/activity.schemas"
import type { ActivityLogService } from "../services/activity-log.service"

/** The signed-in member's own account activity: sign-ins, failed sign-ins, password resets and organizations they owned that were deleted. */
export function createAccountActivityRouter(
  activityLogService: ActivityLogService
) {
  return new Hono<AuthenticatedEnv>().get(
    "/activity",
    describeRoute({
      tags: [OPENAPI_TAGS.ACTIVITY],
      operationId: "listAccountActivity",
      summary:
        "List the signed-in member's sign-ins, failed sign-ins and other account activity, newest first",
      responses: {
        200: describeJsonResponse(
          "Account activity",
          activityLogPageSuccessResponseSchema
        ),
        ...describeApiErrorResponses(
          ACTIVITY_ROUTE_ERROR_DESCRIPTIONS.ACCOUNT_LIST
        ),
      },
    }),
    validateRequest("query", paginationQuerySchema),
    async (c) => {
      const activity = await activityLogService.listAccountActivity(
        c.get("authSession"),
        c.req.valid("query")
      )

      return c.json(
        createApiSuccessResponse(ACTIVITY_SUCCESS_RESULTS.LIST, activity),
        200
      )
    }
  )
}
