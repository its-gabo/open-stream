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
  libraryEncodingSuccessResponseSchema,
  libraryEncodingUpdateBodySchema,
  libraryParamSchema,
} from "../dto/libraries.schemas"
import { requireLibrary } from "../middleware/library-access.middleware"
import type { LibrariesService } from "../services/libraries.service"
import type { LibraryEnv } from "../types/libraries.types"

/** The HLS qualities a library transcodes uploads to; owner-only, like its other settings. */
export function createLibraryEncodingRouter(
  organizationsService: OrganizationsService,
  librariesService: LibrariesService
) {
  const requireOwnerOfLibrary = [
    requireOrganizationMembership(organizationsService),
    requireActiveOrganization,
    requireOrganizationOwner,
    requireLibrary(librariesService),
  ] as const

  return new Hono<LibraryEnv>()
    .get(
      "/:organizationSlug/libraries/:libraryId/encoding",
      describeRoute({
        tags: [OPENAPI_TAGS.LIBRARIES],
        operationId: "getLibraryEncoding",
        summary: "Read which qualities the library transcodes uploads to",
        responses: {
          200: describeJsonResponse(
            "Library encoding settings",
            libraryEncodingSuccessResponseSchema
          ),
          ...describeApiErrorResponses(
            LIBRARY_ROUTE_ERROR_DESCRIPTIONS.API_ACCESS
          ),
        },
      }),
      validateRequest("param", libraryParamSchema),
      ...requireOwnerOfLibrary,
      (c) =>
        c.json(
          createApiSuccessResponse(
            LIBRARY_SUCCESS_RESULTS.ENCODING_GET,
            librariesService.getEncodingSettings(c.get("library"))
          ),
          200
        )
    )
    .put(
      "/:organizationSlug/libraries/:libraryId/encoding",
      describeRoute({
        tags: [OPENAPI_TAGS.LIBRARIES],
        operationId: "updateLibraryEncoding",
        summary:
          "Choose the qualities new uploads are transcoded to; reprocess earlier videos to apply them",
        responses: {
          200: describeJsonResponse(
            "Library encoding settings saved",
            libraryEncodingSuccessResponseSchema
          ),
          ...describeApiErrorResponses(
            LIBRARY_ROUTE_ERROR_DESCRIPTIONS.SECURITY_UPDATE
          ),
        },
      }),
      validateRequest("param", libraryParamSchema),
      validateRequest("json", libraryEncodingUpdateBodySchema),
      ...requireOwnerOfLibrary,
      async (c) => {
        const encoding = await librariesService.updateEncodingSettings(
          c.get("library"),
          c.get("activityActor"),
          c.req.valid("json")
        )

        return c.json(
          createApiSuccessResponse(
            LIBRARY_SUCCESS_RESULTS.ENCODING_UPDATE,
            encoding
          ),
          200
        )
      }
    )
}
