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
  organizationEmptySuccessResponseSchema,
  organizationInvitationParamSchema,
  organizationSummarySuccessResponseSchema,
} from "../dto/organizations.schemas"
import type { OrganizationInvitationsService } from "../services/organization-invitations.service"

/** Invitations addressed to the signed-in user; they are listed by `GET /organizations/context`. */
export function createOrganizationInvitationsRouter(
  organizationInvitationsService: OrganizationInvitationsService
) {
  return new Hono<AuthenticatedEnv>()
    .post(
      "/:invitationId/accept",
      describeRoute({
        tags: [OPENAPI_TAGS.ORGANIZATIONS],
        operationId: "acceptOrganizationInvitation",
        summary: "Join the organization of an invitation",
        responses: {
          200: describeJsonResponse(
            "Invitation accepted",
            organizationSummarySuccessResponseSchema
          ),
          ...describeApiErrorResponses(
            ORGANIZATION_ROUTE_ERROR_DESCRIPTIONS.INVITATION_ANSWER
          ),
        },
      }),
      validateRequest("param", organizationInvitationParamSchema),
      async (c) => {
        const accepted = await organizationInvitationsService.acceptInvitation(
          c.get("authSession"),
          c.req.valid("param").invitationId
        )

        return c.json(
          createApiSuccessResponse(
            ORGANIZATION_SUCCESS_RESULTS.INVITATION_ACCEPT,
            accepted
          ),
          200
        )
      }
    )
    .post(
      "/:invitationId/decline",
      describeRoute({
        tags: [OPENAPI_TAGS.ORGANIZATIONS],
        operationId: "declineOrganizationInvitation",
        summary: "Decline an invitation",
        responses: {
          200: describeJsonResponse(
            "Invitation declined",
            organizationEmptySuccessResponseSchema
          ),
          ...describeApiErrorResponses(
            ORGANIZATION_ROUTE_ERROR_DESCRIPTIONS.INVITATION_ANSWER
          ),
        },
      }),
      validateRequest("param", organizationInvitationParamSchema),
      async (c) => {
        await organizationInvitationsService.declineInvitation(
          c.get("authSession"),
          c.req.valid("param").invitationId
        )

        return c.json(
          createApiSuccessResponse(
            ORGANIZATION_SUCCESS_RESULTS.INVITATION_DECLINE,
            {}
          ),
          200
        )
      }
    )
}
