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
  libraryStorageSuccessResponseSchema,
  libraryStorageUpdateBodySchema,
} from "../dto/libraries.schemas"
import { requireLibrary } from "../middleware/library-access.middleware"
import type { LibrariesService } from "../services/libraries.service"
import type { LibraryStorageService } from "../services/library-storage.service"
import type { LibraryEnv } from "../types/libraries.types"

/** Which storage a library writes its videos to; owner-only, like the storages themselves. */
export function createLibraryStorageRouter(
  organizationsService: OrganizationsService,
  librariesService: LibrariesService,
  libraryStorageService: LibraryStorageService
) {
  const requireOwnerOfLibrary = [
    requireOrganizationMembership(organizationsService),
    requireActiveOrganization,
    requireOrganizationOwner,
    requireLibrary(librariesService),
  ] as const

  return new Hono<LibraryEnv>()
    .get(
      "/:organizationSlug/libraries/:libraryId/storage",
      describeRoute({
        tags: [OPENAPI_TAGS.LIBRARIES],
        operationId: "getLibraryStorage",
        summary: "Read where the library stores its videos",
        responses: {
          200: describeJsonResponse(
            "Library storage",
            libraryStorageSuccessResponseSchema
          ),
          ...describeApiErrorResponses(
            LIBRARY_ROUTE_ERROR_DESCRIPTIONS.STORAGE_GET
          ),
        },
      }),
      validateRequest("param", libraryParamSchema),
      ...requireOwnerOfLibrary,
      async (c) => {
        const storage = await libraryStorageService.getStorageSettings(
          c.get("library")
        )

        return c.json(
          createApiSuccessResponse(
            LIBRARY_SUCCESS_RESULTS.STORAGE_GET,
            storage
          ),
          200
        )
      }
    )
    .put(
      "/:organizationSlug/libraries/:libraryId/storage",
      describeRoute({
        tags: [OPENAPI_TAGS.LIBRARIES],
        operationId: "updateLibraryStorage",
        summary:
          "Store the library's videos in one of the organization's storages, or in the default storage",
        responses: {
          200: describeJsonResponse(
            "Library storage changed",
            libraryStorageSuccessResponseSchema
          ),
          ...describeApiErrorResponses(
            LIBRARY_ROUTE_ERROR_DESCRIPTIONS.STORAGE_UPDATE
          ),
        },
      }),
      validateRequest("param", libraryParamSchema),
      validateRequest("json", libraryStorageUpdateBodySchema),
      ...requireOwnerOfLibrary,
      async (c) => {
        const storage = await libraryStorageService.assignStorage(
          c.get("library"),
          c.get("activityActor"),
          c.req.valid("json")
        )

        return c.json(
          createApiSuccessResponse(
            LIBRARY_SUCCESS_RESULTS.STORAGE_UPDATE,
            storage
          ),
          200
        )
      }
    )
}
