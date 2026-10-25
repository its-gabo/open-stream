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
  organizationEmptySuccessResponseSchema,
  organizationInvitationCreateBodySchema,
  organizationInvitationSuccessResponseSchema,
  organizationParamSchema,
  organizationTeamInvitationParamSchema,
  organizationTeamMemberParamSchema,
  organizationTeamSuccessResponseSchema,
} from "../dto/organizations.schemas"
import {
  requireActiveOrganization,
  requireOrganizationMembership,
  requireOrganizationOwner,
} from "../middleware/organization-access.middleware"
import type { OrganizationTeamService } from "../services/organization-team.service"
import type { OrganizationsService } from "../services/organizations.service"
import type { OrganizationEnv } from "../types/organizations.types"

/** Team management of an active organization; changes are owner-only. */
export function createOrganizationTeamRouter(
  organizationsService: OrganizationsService,
  organizationTeamService: OrganizationTeamService
) {
  const requireMembership = requireOrganizationMembership(organizationsService)

  return new Hono<OrganizationEnv>()
    .get(
      "/:organizationSlug/team",
      describeRoute({
        tags: [OPENAPI_TAGS.ORGANIZATIONS],
        operationId: "getOrganizationTeam",
        summary: "List members, and open invitations for the owner",
        responses: {
          200: describeJsonResponse(
            "Organization team",
            organizationTeamSuccessResponseSchema
          ),
          ...describeApiErrorResponses(
            ORGANIZATION_ROUTE_ERROR_DESCRIPTIONS.TEAM
          ),
        },
      }),
      validateRequest("param", organizationParamSchema),
      requireMembership,
      requireActiveOrganization,
      async (c) => {
        const team = await organizationTeamService.getTeam(
          c.get("organizationAccess")
        )

        return c.json(
          createApiSuccessResponse(ORGANIZATION_SUCCESS_RESULTS.TEAM, team),
          200
        )
      }
    )
    .post(
      "/:organizationSlug/team/invitations",
      describeRoute({
        tags: [OPENAPI_TAGS.ORGANIZATIONS],
        operationId: "inviteOrganizationMember",
        summary: "Invite an email address to join as a member",
        responses: {
          201: describeJsonResponse(
            "Invitation sent",
            organizationInvitationSuccessResponseSchema
          ),
          ...describeApiErrorResponses(
            ORGANIZATION_ROUTE_ERROR_DESCRIPTIONS.INVITATION_CREATE
          ),
        },
      }),
      validateRequest("param", organizationParamSchema),
      validateRequest("json", organizationInvitationCreateBodySchema),
      requireMembership,
      requireActiveOrganization,
      requireOrganizationOwner,
      async (c) => {
        const invitation = await organizationTeamService.inviteMember(
          c.get("organizationAccess"),
          c.get("authSession"),
          c.req.valid("json")
        )

        return c.json(
          createApiSuccessResponse(
            ORGANIZATION_SUCCESS_RESULTS.INVITATION_CREATE,
            invitation
          ),
          201
        )
      }
    )
    .post(
      "/:organizationSlug/team/invitations/:invitationId/resend",
      describeRoute({
        tags: [OPENAPI_TAGS.ORGANIZATIONS],
        operationId: "resendOrganizationInvitation",
        summary: "Send a pending or expired invitation again with a new expiry",
        responses: {
          200: describeJsonResponse(
            "Invitation resent",
            organizationInvitationSuccessResponseSchema
          ),
          ...describeApiErrorResponses(
            ORGANIZATION_ROUTE_ERROR_DESCRIPTIONS.INVITATION_RESEND
          ),
        },
      }),
      validateRequest("param", organizationTeamInvitationParamSchema),
      requireMembership,
      requireActiveOrganization,
      requireOrganizationOwner,
      async (c) => {
        const invitation = await organizationTeamService.resendInvitation(
          c.get("organizationAccess"),
          c.get("authSession"),
          c.req.valid("param").invitationId
        )

        return c.json(
          createApiSuccessResponse(
            ORGANIZATION_SUCCESS_RESULTS.INVITATION_RESEND,
            invitation
          ),
          200
        )
      }
    )
    .delete(
      "/:organizationSlug/team/invitations/:invitationId",
      describeRoute({
        tags: [OPENAPI_TAGS.ORGANIZATIONS],
        operationId: "cancelOrganizationInvitation",
        summary: "Cancel a pending or expired invitation",
        responses: {
          200: describeJsonResponse(
            "Invitation canceled",
            organizationEmptySuccessResponseSchema
          ),
          ...describeApiErrorResponses(
            ORGANIZATION_ROUTE_ERROR_DESCRIPTIONS.INVITATION_CANCEL
          ),
        },
      }),
      validateRequest("param", organizationTeamInvitationParamSchema),
      requireMembership,
      requireActiveOrganization,
      requireOrganizationOwner,
      async (c) => {
        await organizationTeamService.cancelInvitation(
          c.get("organizationAccess"),
          c.req.valid("param").invitationId
        )

        return c.json(
          createApiSuccessResponse(
            ORGANIZATION_SUCCESS_RESULTS.INVITATION_CANCEL,
            {}
          ),
          200
        )
      }
    )
    .delete(
      "/:organizationSlug/team/members/:membershipId",
      describeRoute({
        tags: [OPENAPI_TAGS.ORGANIZATIONS],
        operationId: "removeOrganizationMember",
        summary: "Remove a member from the organization",
        responses: {
          200: describeJsonResponse(
            "Member removed",
            organizationEmptySuccessResponseSchema
          ),
          ...describeApiErrorResponses(
            ORGANIZATION_ROUTE_ERROR_DESCRIPTIONS.MEMBER_REMOVE
          ),
        },
      }),
      validateRequest("param", organizationTeamMemberParamSchema),
      requireMembership,
      requireActiveOrganization,
      requireOrganizationOwner,
      async (c) => {
        await organizationTeamService.removeMember(
          c.get("organizationAccess"),
          c.req.valid("param").membershipId
        )

        return c.json(
          createApiSuccessResponse(
            ORGANIZATION_SUCCESS_RESULTS.MEMBER_REMOVE,
            {}
          ),
          200
        )
      }
    )
}
