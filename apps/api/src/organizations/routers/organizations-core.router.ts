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
  organizationContextSuccessResponseSchema,
  organizationCreateBodySchema,
  organizationCreateSuccessResponseSchema,
  organizationEmptySuccessResponseSchema,
  organizationGetSuccessResponseSchema,
  organizationOwnershipTransferBodySchema,
  organizationParamSchema,
  organizationSlugSuggestionQuerySchema,
  organizationSlugSuggestionSuccessResponseSchema,
  organizationSummarySuccessResponseSchema,
  organizationUpdateBodySchema,
} from "../dto/organizations.schemas"
import {
  requireActiveOrganization,
  requireOrganizationMembership,
  requireOrganizationOwner,
} from "../middleware/organization-access.middleware"
import type { OrganizationTeamService } from "../services/organization-team.service"
import type { OrganizationsService } from "../services/organizations.service"
import type { OrganizationEnv } from "../types/organizations.types"

export function createOrganizationsCoreRouter(
  organizationsService: OrganizationsService,
  organizationTeamService: OrganizationTeamService
) {
  const requireMembership = requireOrganizationMembership(organizationsService)

  return new Hono<OrganizationEnv>()
    .get(
      "/context",
      describeRoute({
        tags: [OPENAPI_TAGS.ORGANIZATIONS],
        operationId: "getOrganizationContext",
        summary:
          "List the user's organizations, pending invitations and membership limit",
        responses: {
          200: describeJsonResponse(
            "Organization context",
            organizationContextSuccessResponseSchema
          ),
          ...describeApiErrorResponses(
            ORGANIZATION_ROUTE_ERROR_DESCRIPTIONS.CONTEXT
          ),
        },
      }),
      async (c) => {
        const context = await organizationsService.getContext(
          c.get("authSession")
        )

        return c.json(
          createApiSuccessResponse(
            ORGANIZATION_SUCCESS_RESULTS.CONTEXT,
            context
          ),
          200
        )
      }
    )
    .get(
      "/slug-suggestion",
      describeRoute({
        tags: [OPENAPI_TAGS.ORGANIZATIONS],
        operationId: "suggestOrganizationSlug",
        summary: "Suggest a free organization address for a name",
        responses: {
          200: describeJsonResponse(
            "Suggested address",
            organizationSlugSuggestionSuccessResponseSchema
          ),
          ...describeApiErrorResponses(
            ORGANIZATION_ROUTE_ERROR_DESCRIPTIONS.SLUG_SUGGESTION
          ),
        },
      }),
      validateRequest("query", organizationSlugSuggestionQuerySchema),
      async (c) => {
        const slug = await organizationsService.suggestSlug(
          c.req.valid("query").name
        )

        return c.json(
          createApiSuccessResponse(
            ORGANIZATION_SUCCESS_RESULTS.SLUG_SUGGESTION,
            { slug }
          ),
          200
        )
      }
    )
    .post(
      "/",
      describeRoute({
        tags: [OPENAPI_TAGS.ORGANIZATIONS],
        operationId: "createOrganization",
        summary: "Create an organization owned by the user",
        responses: {
          201: describeJsonResponse(
            "Organization created",
            organizationCreateSuccessResponseSchema
          ),
          ...describeApiErrorResponses(
            ORGANIZATION_ROUTE_ERROR_DESCRIPTIONS.CREATE
          ),
        },
      }),
      validateRequest("json", organizationCreateBodySchema),
      async (c) => {
        const created = await organizationsService.createOrganization(
          c.get("authSession"),
          c.get("activityActor"),
          c.req.valid("json")
        )

        return c.json(
          createApiSuccessResponse(
            ORGANIZATION_SUCCESS_RESULTS.CREATE,
            created
          ),
          201
        )
      }
    )
    .get(
      "/:organizationSlug",
      describeRoute({
        tags: [OPENAPI_TAGS.ORGANIZATIONS],
        operationId: "getOrganization",
        summary: "Read an organization and the user's membership in it",
        responses: {
          200: describeJsonResponse(
            "Organization",
            organizationGetSuccessResponseSchema
          ),
          ...describeApiErrorResponses(
            ORGANIZATION_ROUTE_ERROR_DESCRIPTIONS.GET
          ),
        },
      }),
      validateRequest("param", organizationParamSchema),
      requireMembership,
      async (c) => {
        const organization = await organizationsService.getOrganization(
          c.get("organizationAccess")
        )

        return c.json(
          createApiSuccessResponse(
            ORGANIZATION_SUCCESS_RESULTS.GET,
            organization
          ),
          200
        )
      }
    )
    .patch(
      "/:organizationSlug",
      describeRoute({
        tags: [OPENAPI_TAGS.ORGANIZATIONS],
        operationId: "updateOrganization",
        summary: "Rename the organization or change its address",
        responses: {
          200: describeJsonResponse(
            "Organization updated",
            organizationSummarySuccessResponseSchema
          ),
          ...describeApiErrorResponses(
            ORGANIZATION_ROUTE_ERROR_DESCRIPTIONS.UPDATE
          ),
        },
      }),
      validateRequest("param", organizationParamSchema),
      validateRequest("json", organizationUpdateBodySchema),
      requireMembership,
      requireActiveOrganization,
      requireOrganizationOwner,
      async (c) => {
        const updated = await organizationsService.updateOrganization(
          c.get("organizationAccess"),
          c.get("activityActor"),
          c.req.valid("json")
        )

        return c.json(
          createApiSuccessResponse(
            ORGANIZATION_SUCCESS_RESULTS.UPDATE,
            updated
          ),
          200
        )
      }
    )
    .post(
      "/:organizationSlug/select",
      describeRoute({
        tags: [OPENAPI_TAGS.ORGANIZATIONS],
        operationId: "selectOrganization",
        summary: "Remember the organization as the user's current one",
        responses: {
          200: describeJsonResponse(
            "Organization selected",
            organizationEmptySuccessResponseSchema
          ),
          ...describeApiErrorResponses(
            ORGANIZATION_ROUTE_ERROR_DESCRIPTIONS.SELECT
          ),
        },
      }),
      validateRequest("param", organizationParamSchema),
      requireMembership,
      async (c) => {
        await organizationsService.selectOrganization(
          c.get("organizationAccess")
        )

        return c.json(
          createApiSuccessResponse(ORGANIZATION_SUCCESS_RESULTS.SELECT, {}),
          200
        )
      }
    )
    .delete(
      "/:organizationSlug/members/me",
      describeRoute({
        tags: [OPENAPI_TAGS.ORGANIZATIONS],
        operationId: "leaveOrganization",
        summary: "Leave the organization (members only)",
        responses: {
          200: describeJsonResponse(
            "Organization left",
            organizationEmptySuccessResponseSchema
          ),
          ...describeApiErrorResponses(
            ORGANIZATION_ROUTE_ERROR_DESCRIPTIONS.LEAVE
          ),
        },
      }),
      validateRequest("param", organizationParamSchema),
      requireMembership,
      requireActiveOrganization,
      async (c) => {
        await organizationTeamService.leaveOrganization(
          c.get("organizationAccess"),
          c.get("authSession"),
          c.get("activityActor")
        )

        return c.json(
          createApiSuccessResponse(ORGANIZATION_SUCCESS_RESULTS.LEAVE, {}),
          200
        )
      }
    )
    .post(
      "/:organizationSlug/ownership-transfer",
      describeRoute({
        tags: [OPENAPI_TAGS.ORGANIZATIONS],
        operationId: "transferOrganizationOwnership",
        summary: "Make a member the owner; the current owner becomes a member",
        responses: {
          200: describeJsonResponse(
            "Ownership transferred",
            organizationEmptySuccessResponseSchema
          ),
          ...describeApiErrorResponses(
            ORGANIZATION_ROUTE_ERROR_DESCRIPTIONS.OWNERSHIP_TRANSFER
          ),
        },
      }),
      validateRequest("param", organizationParamSchema),
      validateRequest("json", organizationOwnershipTransferBodySchema),
      requireMembership,
      requireActiveOrganization,
      requireOrganizationOwner,
      async (c) => {
        await organizationTeamService.transferOwnership(
          c.get("organizationAccess"),
          c.get("authSession"),
          c.get("activityActor"),
          c.req.valid("json")
        )

        return c.json(
          createApiSuccessResponse(
            ORGANIZATION_SUCCESS_RESULTS.OWNERSHIP_TRANSFER,
            {}
          ),
          200
        )
      }
    )
}
