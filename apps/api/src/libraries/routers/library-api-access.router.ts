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
  libraryApiAccessSuccessResponseSchema,
  libraryApiKeyCreateBodySchema,
  libraryApiKeyParamSchema,
  libraryApiKeySecretSuccessResponseSchema,
  libraryApiKeySuccessResponseSchema,
  libraryApiKeyUpdateBodySchema,
  libraryEmptySuccessResponseSchema,
  libraryParamSchema,
  librarySecurityUpdateBodySchema,
} from "../dto/libraries.schemas"
import { requireLibrary } from "../middleware/library-access.middleware"
import type { LibrariesService } from "../services/libraries.service"
import type { LibraryApiAccessService } from "../services/library-api-access.service"
import type { LibraryEnv } from "../types/libraries.types"

/** The library's API keys and playback security; owner-only. */
export function createLibraryApiAccessRouter(
  organizationsService: OrganizationsService,
  librariesService: LibrariesService,
  libraryApiAccessService: LibraryApiAccessService
) {
  const requireOwnerOfLibrary = [
    requireOrganizationMembership(organizationsService),
    requireActiveOrganization,
    requireOrganizationOwner,
    requireLibrary(librariesService),
  ] as const

  return new Hono<LibraryEnv>()
    .get(
      "/:organizationSlug/libraries/:libraryId/api-access",
      describeRoute({
        tags: [OPENAPI_TAGS.LIBRARIES],
        operationId: "getLibraryApiAccess",
        summary:
          "Read the library's API identifier, keys and security settings",
        responses: {
          200: describeJsonResponse(
            "Library API access",
            libraryApiAccessSuccessResponseSchema
          ),
          ...describeApiErrorResponses(
            LIBRARY_ROUTE_ERROR_DESCRIPTIONS.API_ACCESS
          ),
        },
      }),
      validateRequest("param", libraryParamSchema),
      ...requireOwnerOfLibrary,
      async (c) => {
        const apiAccess = await libraryApiAccessService.getApiAccess(
          c.get("library")
        )

        return c.json(
          createApiSuccessResponse(
            LIBRARY_SUCCESS_RESULTS.API_ACCESS_GET,
            apiAccess
          ),
          200
        )
      }
    )
    .post(
      "/:organizationSlug/libraries/:libraryId/api-keys",
      describeRoute({
        tags: [OPENAPI_TAGS.LIBRARIES],
        operationId: "createLibraryApiKey",
        summary:
          "Create a named API key with the given scopes; its secret is shown only once",
        responses: {
          201: describeJsonResponse(
            "Library API key created",
            libraryApiKeySecretSuccessResponseSchema
          ),
          ...describeApiErrorResponses(
            LIBRARY_ROUTE_ERROR_DESCRIPTIONS.API_KEY_CREATE
          ),
        },
      }),
      validateRequest("param", libraryParamSchema),
      validateRequest("json", libraryApiKeyCreateBodySchema),
      ...requireOwnerOfLibrary,
      async (c) => {
        const created = await libraryApiAccessService.createApiKey(
          c.get("library"),
          c.get("activityActor"),
          c.req.valid("json")
        )

        return c.json(
          createApiSuccessResponse(
            LIBRARY_SUCCESS_RESULTS.API_KEY_CREATE,
            created
          ),
          201
        )
      }
    )
    .patch(
      "/:organizationSlug/libraries/:libraryId/api-keys/:apiKeyId",
      describeRoute({
        tags: [OPENAPI_TAGS.LIBRARIES],
        operationId: "updateLibraryApiKey",
        summary: "Rename an API key or change its scopes",
        responses: {
          200: describeJsonResponse(
            "Library API key updated",
            libraryApiKeySuccessResponseSchema
          ),
          ...describeApiErrorResponses(
            LIBRARY_ROUTE_ERROR_DESCRIPTIONS.API_KEY_CHANGE
          ),
        },
      }),
      validateRequest("param", libraryApiKeyParamSchema),
      validateRequest("json", libraryApiKeyUpdateBodySchema),
      ...requireOwnerOfLibrary,
      async (c) => {
        const updated = await libraryApiAccessService.updateApiKey(
          c.get("library"),
          c.get("activityActor"),
          c.req.valid("param").apiKeyId,
          c.req.valid("json")
        )

        return c.json(
          createApiSuccessResponse(
            LIBRARY_SUCCESS_RESULTS.API_KEY_UPDATE,
            updated
          ),
          200
        )
      }
    )
    .post(
      "/:organizationSlug/libraries/:libraryId/api-keys/:apiKeyId/roll",
      describeRoute({
        tags: [OPENAPI_TAGS.LIBRARIES],
        operationId: "rollLibraryApiKey",
        summary:
          "Give an API key a new secret; the old secret and the playback URLs it signed stop working",
        responses: {
          200: describeJsonResponse(
            "Library API key rolled",
            libraryApiKeySecretSuccessResponseSchema
          ),
          ...describeApiErrorResponses(
            LIBRARY_ROUTE_ERROR_DESCRIPTIONS.API_KEY_CHANGE
          ),
        },
      }),
      validateRequest("param", libraryApiKeyParamSchema),
      ...requireOwnerOfLibrary,
      async (c) => {
        const rolled = await libraryApiAccessService.rollApiKey(
          c.get("library"),
          c.get("activityActor"),
          c.req.valid("param").apiKeyId
        )

        return c.json(
          createApiSuccessResponse(
            LIBRARY_SUCCESS_RESULTS.API_KEY_ROLL,
            rolled
          ),
          200
        )
      }
    )
    .delete(
      "/:organizationSlug/libraries/:libraryId/api-keys/:apiKeyId",
      describeRoute({
        tags: [OPENAPI_TAGS.LIBRARIES],
        operationId: "deleteLibraryApiKey",
        summary: "Revoke an API key and the playback URLs it signed",
        responses: {
          200: describeJsonResponse(
            "Library API key revoked",
            libraryEmptySuccessResponseSchema
          ),
          ...describeApiErrorResponses(
            LIBRARY_ROUTE_ERROR_DESCRIPTIONS.API_KEY_CHANGE
          ),
        },
      }),
      validateRequest("param", libraryApiKeyParamSchema),
      ...requireOwnerOfLibrary,
      async (c) => {
        const deleted = await libraryApiAccessService.deleteApiKey(
          c.get("library"),
          c.get("activityActor"),
          c.req.valid("param").apiKeyId
        )

        return c.json(
          createApiSuccessResponse(
            LIBRARY_SUCCESS_RESULTS.API_KEY_DELETE,
            deleted
          ),
          200
        )
      }
    )
    .put(
      "/:organizationSlug/libraries/:libraryId/security",
      describeRoute({
        tags: [OPENAPI_TAGS.LIBRARIES],
        operationId: "updateLibrarySecurity",
        summary: "Choose which sites may play the library's videos, and how",
        responses: {
          200: describeJsonResponse(
            "Library security saved",
            libraryApiAccessSuccessResponseSchema
          ),
          ...describeApiErrorResponses(
            LIBRARY_ROUTE_ERROR_DESCRIPTIONS.SECURITY_UPDATE
          ),
        },
      }),
      validateRequest("param", libraryParamSchema),
      validateRequest("json", librarySecurityUpdateBodySchema),
      ...requireOwnerOfLibrary,
      async (c) => {
        const updated = await libraryApiAccessService.updateSecurity(
          c.get("library"),
          c.get("activityActor"),
          c.req.valid("json")
        )

        return c.json(
          createApiSuccessResponse(
            LIBRARY_SUCCESS_RESULTS.SECURITY_UPDATE,
            updated
          ),
          200
        )
      }
    )
}
