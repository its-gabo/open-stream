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
import { STORAGE_ROUTE_ERROR_DESCRIPTIONS } from "../constants/storages-openapi.constants"
import { STORAGE_SUCCESS_RESULTS } from "../dto/storages.responses"
import {
  storageConnectionTestBodySchema,
  storageConnectionTestSuccessResponseSchema,
  storageCreateBodySchema,
  storageEmptySuccessResponseSchema,
  storageListSuccessResponseSchema,
  storageParamSchema,
  storageSuccessResponseSchema,
  storageUpdateBodySchema,
} from "../dto/storages.schemas"
import { requireStorage } from "../middleware/storage-access.middleware"
import type { StoragesService } from "../services/storages.service"
import type { StorageEnv } from "../types/storage.types"

/** Storages of an active organization; owner-only, as they hold credentials. */
export function createStoragesCoreRouter(
  organizationsService: OrganizationsService,
  storagesService: StoragesService
) {
  const requireOwner = [
    requireOrganizationMembership(organizationsService),
    requireActiveOrganization,
    requireOrganizationOwner,
  ] as const
  const requireOwnedStorage = [
    ...requireOwner,
    requireStorage(storagesService),
  ] as const

  return new Hono<StorageEnv>()
    .get(
      "/:organizationSlug/storages",
      describeRoute({
        tags: [OPENAPI_TAGS.STORAGES],
        operationId: "listStorages",
        summary:
          "List and search the organization's storages, a page at a time",
        responses: {
          200: describeJsonResponse(
            "Storages",
            storageListSuccessResponseSchema
          ),
          ...describeApiErrorResponses(STORAGE_ROUTE_ERROR_DESCRIPTIONS.LIST),
        },
      }),
      validateRequest("param", organizationParamSchema),
      validateRequest("query", paginationQuerySchema),
      ...requireOwner,
      async (c) => {
        const storages = await storagesService.listStorages(
          c.get("organizationAccess"),
          c.req.valid("query")
        )

        return c.json(
          createApiSuccessResponse(STORAGE_SUCCESS_RESULTS.LIST, storages),
          200
        )
      }
    )
    .post(
      "/:organizationSlug/storages",
      describeRoute({
        tags: [OPENAPI_TAGS.STORAGES],
        operationId: "createStorage",
        summary: "Connect an S3-compatible bucket",
        responses: {
          201: describeJsonResponse(
            "Storage created",
            storageSuccessResponseSchema
          ),
          ...describeApiErrorResponses(STORAGE_ROUTE_ERROR_DESCRIPTIONS.CREATE),
        },
      }),
      validateRequest("param", organizationParamSchema),
      validateRequest("json", storageCreateBodySchema),
      ...requireOwner,
      async (c) => {
        const created = await storagesService.createStorage(
          c.get("organizationAccess"),
          c.get("activityActor"),
          c.req.valid("json")
        )

        return c.json(
          createApiSuccessResponse(STORAGE_SUCCESS_RESULTS.CREATE, created),
          201
        )
      }
    )
    .post(
      "/:organizationSlug/storages/connection-tests",
      describeRoute({
        tags: [OPENAPI_TAGS.STORAGES],
        operationId: "testStorageConnection",
        summary: "Check unsaved storage settings can reach their bucket",
        responses: {
          200: describeJsonResponse(
            "Connection tested",
            storageConnectionTestSuccessResponseSchema
          ),
          ...describeApiErrorResponses(STORAGE_ROUTE_ERROR_DESCRIPTIONS.TEST),
        },
      }),
      validateRequest("param", organizationParamSchema),
      validateRequest("json", storageConnectionTestBodySchema),
      ...requireOwner,
      async (c) => {
        const result = await storagesService.testConnection(c.req.valid("json"))

        return c.json(
          createApiSuccessResponse(STORAGE_SUCCESS_RESULTS.TEST, result),
          200
        )
      }
    )
    .get(
      "/:organizationSlug/storages/:storageId",
      describeRoute({
        tags: [OPENAPI_TAGS.STORAGES],
        operationId: "getStorage",
        summary: "Read a storage",
        responses: {
          200: describeJsonResponse("Storage", storageSuccessResponseSchema),
          ...describeApiErrorResponses(STORAGE_ROUTE_ERROR_DESCRIPTIONS.GET),
        },
      }),
      validateRequest("param", storageParamSchema),
      ...requireOwnedStorage,
      (c) =>
        c.json(
          createApiSuccessResponse(
            STORAGE_SUCCESS_RESULTS.GET,
            storagesService.getStorage(c.get("storage"))
          ),
          200
        )
    )
    .patch(
      "/:organizationSlug/storages/:storageId",
      describeRoute({
        tags: [OPENAPI_TAGS.STORAGES],
        operationId: "updateStorage",
        summary: "Change a storage's name, settings or credentials",
        responses: {
          200: describeJsonResponse(
            "Storage updated",
            storageSuccessResponseSchema
          ),
          ...describeApiErrorResponses(STORAGE_ROUTE_ERROR_DESCRIPTIONS.UPDATE),
        },
      }),
      validateRequest("param", storageParamSchema),
      validateRequest("json", storageUpdateBodySchema),
      ...requireOwnedStorage,
      async (c) => {
        const updated = await storagesService.updateStorage(
          c.get("storage"),
          c.get("activityActor"),
          c.req.valid("json")
        )

        return c.json(
          createApiSuccessResponse(STORAGE_SUCCESS_RESULTS.UPDATE, updated),
          200
        )
      }
    )
    .delete(
      "/:organizationSlug/storages/:storageId",
      describeRoute({
        tags: [OPENAPI_TAGS.STORAGES],
        operationId: "deleteStorage",
        summary: "Delete a storage no library uses",
        responses: {
          200: describeJsonResponse(
            "Storage deleted",
            storageEmptySuccessResponseSchema
          ),
          ...describeApiErrorResponses(STORAGE_ROUTE_ERROR_DESCRIPTIONS.DELETE),
        },
      }),
      validateRequest("param", storageParamSchema),
      ...requireOwnedStorage,
      async (c) => {
        const deleted = await storagesService.deleteStorage(
          c.get("storage"),
          c.get("activityActor")
        )

        return c.json(
          createApiSuccessResponse(STORAGE_SUCCESS_RESULTS.DELETE, deleted),
          200
        )
      }
    )
    .post(
      "/:organizationSlug/storages/:storageId/connection-tests",
      describeRoute({
        tags: [OPENAPI_TAGS.STORAGES],
        operationId: "testSavedStorageConnection",
        summary: "Check a saved storage can still reach its bucket",
        responses: {
          200: describeJsonResponse(
            "Connection tested",
            storageConnectionTestSuccessResponseSchema
          ),
          ...describeApiErrorResponses(
            STORAGE_ROUTE_ERROR_DESCRIPTIONS.TEST_SAVED
          ),
        },
      }),
      validateRequest("param", storageParamSchema),
      ...requireOwnedStorage,
      async (c) => {
        const result = await storagesService.testSavedStorage(c.get("storage"))

        return c.json(
          createApiSuccessResponse(STORAGE_SUCCESS_RESULTS.TEST, result),
          200
        )
      }
    )
}
