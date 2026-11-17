import { Hono } from "hono"
import { describeRoute } from "hono-openapi"
import { OPENAPI_TAGS } from "../../common/http/openapi/openapi.constants"
import {
  describeApiErrorResponses,
  describeJsonResponse,
} from "../../common/http/openapi/openapi.utils"
import { createApiSuccessResponse } from "../../common/http/response/response.factory"
import { validateRequest } from "../../common/http/validation/validate-request"
import {
  requireActiveOrganization,
  requireOrganizationMembership,
  requireOrganizationOwner,
} from "../../organizations/middleware/organization-access.middleware"
import type { OrganizationsService } from "../../organizations/services/organizations.service"
import { LIBRARY_ROUTE_ERROR_DESCRIPTIONS } from "../constants/libraries-openapi.constants"
import { LIBRARY_SUCCESS_RESULTS } from "../dto/libraries.responses"
import {
  libraryParamSchema,
  libraryPlayerSuccessResponseSchema,
  libraryPlayerUpdateBodySchema,
} from "../dto/libraries.schemas"
import { requireLibrary } from "../middleware/library-access.middleware"
import type { LibrariesService } from "../services/libraries.service"
import type { LibraryEnv } from "../types/libraries.types"

/** How the library's embedded player looks; members read it for their embed codes, and only the owner changes it. */
export function createLibraryPlayerRouter(
  organizationsService: OrganizationsService,
  librariesService: LibrariesService
) {
  const requireMemberOfLibrary = [
    requireOrganizationMembership(organizationsService),
    requireActiveOrganization,
    requireLibrary(librariesService),
  ] as const
  const requireOwnerOfLibrary = [
    requireOrganizationMembership(organizationsService),
    requireActiveOrganization,
    requireOrganizationOwner,
    requireLibrary(librariesService),
  ] as const

  return new Hono<LibraryEnv>()
    .get(
      "/:organizationSlug/libraries/:libraryId/player",
      describeRoute({
        tags: [OPENAPI_TAGS.LIBRARIES],
        operationId: "getLibraryPlayer",
        summary: "Read how the library's embedded player looks",
        responses: {
          200: describeJsonResponse(
            "Library player settings",
            libraryPlayerSuccessResponseSchema
          ),
          ...describeApiErrorResponses(LIBRARY_ROUTE_ERROR_DESCRIPTIONS.GET),
        },
      }),
      validateRequest("param", libraryParamSchema),
      ...requireMemberOfLibrary,
      (c) =>
        c.json(
          createApiSuccessResponse(
            LIBRARY_SUCCESS_RESULTS.PLAYER_GET,
            librariesService.getPlayerSettings(c.get("library"))
          ),
          200
        )
    )
    .put(
      "/:organizationSlug/libraries/:libraryId/player",
      describeRoute({
        tags: [OPENAPI_TAGS.LIBRARIES],
        operationId: "updateLibraryPlayer",
        summary:
          "Choose the player's accent color and controls; embeds use them from their next load",
        responses: {
          200: describeJsonResponse(
            "Library player settings saved",
            libraryPlayerSuccessResponseSchema
          ),
          ...describeApiErrorResponses(
            LIBRARY_ROUTE_ERROR_DESCRIPTIONS.SECURITY_UPDATE
          ),
        },
      }),
      validateRequest("param", libraryParamSchema),
      validateRequest("json", libraryPlayerUpdateBodySchema),
      ...requireOwnerOfLibrary,
      async (c) => {
        const player = await librariesService.updatePlayerSettings(
          c.get("library"),
          c.get("activityActor"),
          c.req.valid("json")
        )

        return c.json(
          createApiSuccessResponse(
            LIBRARY_SUCCESS_RESULTS.PLAYER_UPDATE,
            player
          ),
          200
        )
      }
    )
}
