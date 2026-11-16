import { Hono } from "hono"
import { describeRoute } from "hono-openapi"
import { paginationQuerySchema } from "../../common/http/pagination/pagination.schemas"
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
  requireOrganizationOwner,
} from "../../organizations/middleware/organization-access.middleware"
import type { OrganizationsService } from "../../organizations/services/organizations.service"
import { LIBRARY_ROUTE_ERROR_DESCRIPTIONS } from "../constants/libraries-openapi.constants"
import { LIBRARY_SUCCESS_RESULTS } from "../dto/libraries.responses"
import {
  libraryCreateBodySchema,
  libraryListSuccessResponseSchema,
  libraryParamSchema,
  librarySuccessResponseSchema,
  libraryUpdateBodySchema,
} from "../dto/libraries.schemas"
import { requireLibrary } from "../middleware/library-access.middleware"
import type { LibrariesService } from "../services/libraries.service"
import type { LibraryEnv } from "../types/libraries.types"

/** Libraries of an active organization; members read them, the owner creates and renames them. */
export function createLibrariesCoreRouter(
  organizationsService: OrganizationsService,
  librariesService: LibrariesService
) {
  const requireMembership = requireOrganizationMembership(organizationsService)

  return new Hono<LibraryEnv>()
    .get(
      "/:organizationSlug/libraries",
      describeRoute({
        tags: [OPENAPI_TAGS.LIBRARIES],
        operationId: "listLibraries",
        summary:
          "List and search the organization's video libraries, a page at a time",
        responses: {
          200: describeJsonResponse(
            "Libraries",
            libraryListSuccessResponseSchema
          ),
          ...describeApiErrorResponses(LIBRARY_ROUTE_ERROR_DESCRIPTIONS.LIST),
        },
      }),
      validateRequest("param", organizationParamSchema),
      validateRequest("query", paginationQuerySchema),
      requireMembership,
      requireActiveOrganization,
      async (c) => {
        const libraries = await librariesService.listLibraries(
          c.get("organizationAccess"),
          c.req.valid("query")
        )

        return c.json(
          createApiSuccessResponse(LIBRARY_SUCCESS_RESULTS.LIST, libraries),
          200
        )
      }
    )
    .post(
      "/:organizationSlug/libraries",
      describeRoute({
        tags: [OPENAPI_TAGS.LIBRARIES],
        operationId: "createLibrary",
        summary: "Create a video library",
        responses: {
          201: describeJsonResponse(
            "Library created",
            librarySuccessResponseSchema
          ),
          ...describeApiErrorResponses(LIBRARY_ROUTE_ERROR_DESCRIPTIONS.CREATE),
        },
      }),
      validateRequest("param", organizationParamSchema),
      validateRequest("json", libraryCreateBodySchema),
      requireMembership,
      requireActiveOrganization,
      requireOrganizationOwner,
      async (c) => {
        const created = await librariesService.createLibrary(
          c.get("organizationAccess"),
          c.get("activityActor"),
          c.req.valid("json")
        )

        return c.json(
          createApiSuccessResponse(LIBRARY_SUCCESS_RESULTS.CREATE, created),
          201
        )
      }
    )
    .get(
      "/:organizationSlug/libraries/:libraryId",
      describeRoute({
        tags: [OPENAPI_TAGS.LIBRARIES],
        operationId: "getLibrary",
        summary: "Read a video library",
        responses: {
          200: describeJsonResponse("Library", librarySuccessResponseSchema),
          ...describeApiErrorResponses(LIBRARY_ROUTE_ERROR_DESCRIPTIONS.GET),
        },
      }),
      validateRequest("param", libraryParamSchema),
      requireMembership,
      requireActiveOrganization,
      requireLibrary(librariesService),
      (c) =>
        c.json(
          createApiSuccessResponse(
            LIBRARY_SUCCESS_RESULTS.GET,
            librariesService.getLibrary(c.get("library"))
          ),
          200
        )
    )
    .patch(
      "/:organizationSlug/libraries/:libraryId",
      describeRoute({
        tags: [OPENAPI_TAGS.LIBRARIES],
        operationId: "updateLibrary",
        summary: "Rename a video library",
        responses: {
          200: describeJsonResponse(
            "Library updated",
            librarySuccessResponseSchema
          ),
          ...describeApiErrorResponses(LIBRARY_ROUTE_ERROR_DESCRIPTIONS.UPDATE),
        },
      }),
      validateRequest("param", libraryParamSchema),
      validateRequest("json", libraryUpdateBodySchema),
      requireMembership,
      requireActiveOrganization,
      requireOrganizationOwner,
      requireLibrary(librariesService),
      async (c) => {
        const updated = await librariesService.renameLibrary(
          c.get("library"),
          c.get("activityActor"),
          c.req.valid("json")
        )

        return c.json(
          createApiSuccessResponse(LIBRARY_SUCCESS_RESULTS.UPDATE, updated),
          200
        )
      }
    )
}
