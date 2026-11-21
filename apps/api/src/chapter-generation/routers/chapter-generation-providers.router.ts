import { Hono } from "hono"
import { describeRoute } from "hono-openapi"
import { requireSession } from "../../auth/middleware/session.middleware"
import type { AuthSessionService } from "../../auth/services/auth-session.service"
import type { AuthCookieService } from "../../auth/services/auth-cookie.service"
import type { AuthenticatedEnv } from "../../auth/types/auth.types"
import { OPENAPI_TAGS } from "../../common/http/openapi/openapi.constants"
import {
  describeApiErrorResponses,
  describeJsonResponse,
} from "../../common/http/openapi/openapi.utils"
import { createApiSuccessResponse } from "../../common/http/response/response.factory"
import { validateRequest } from "../../common/http/validation/validate-request"
import { libraryEmptySuccessResponseSchema } from "../../libraries/dto/libraries.schemas"
import { organizationParamSchema } from "../../organizations/dto/organizations.schemas"
import {
  requireActiveOrganization,
  requireOrganizationMembership,
  requireOrganizationOwner,
} from "../../organizations/middleware/organization-access.middleware"
import type { OrganizationsService } from "../../organizations/services/organizations.service"
import { CHAPTER_GENERATION_ROUTE_ERROR_DESCRIPTIONS } from "../constants/chapter-generation-openapi.constants"
import { CHAPTER_GENERATION_SUCCESS_RESULTS } from "../dto/chapter-generation.responses"
import {
  chapterGenerationConnectionTestSuccessResponseSchema,
  chapterGenerationProviderCreateBodySchema,
  chapterGenerationProviderListSuccessResponseSchema,
  chapterGenerationProviderParamSchema,
  chapterGenerationProviderSuccessResponseSchema,
  chapterGenerationProviderUpdateBodySchema,
} from "../dto/chapter-generation.schemas"
import { requireChapterGenerationProvider } from "../middleware/chapter-generation-provider-access.middleware"
import type { ChapterGenerationProvidersService } from "../services/chapter-generation-providers.service"
import type { ChapterGenerationProviderEnv } from "../types/chapter-generation.types"

type ChapterGenerationProvidersRouterDependencies = {
  authSessionService: AuthSessionService
  authCookieService: AuthCookieService
  organizationsService: OrganizationsService
  chapterGenerationProvidersService: ChapterGenerationProvidersService
}

/**
 * Chapter generation providers of an active organization; owner-only, as they
 * hold API keys. Every route requires a session. Mount at the API root.
 */
export function createChapterGenerationProvidersRouter({
  authSessionService,
  authCookieService,
  organizationsService,
  chapterGenerationProvidersService,
}: ChapterGenerationProvidersRouterDependencies) {
  const requireOwner = [
    requireOrganizationMembership(organizationsService),
    requireActiveOrganization,
    requireOrganizationOwner,
  ] as const
  const requireOwnedProvider = [
    ...requireOwner,
    requireChapterGenerationProvider(chapterGenerationProvidersService),
  ] as const

  return new Hono().route(
    "/organizations",
    new Hono<AuthenticatedEnv>()
      .use(requireSession(authSessionService, authCookieService))
      .route(
        "/",
        new Hono<ChapterGenerationProviderEnv>()
          .get(
            "/:organizationSlug/chapter-generation-providers",
            describeRoute({
              tags: [OPENAPI_TAGS.CHAPTER_GENERATION_PROVIDERS],
              operationId: "listChapterGenerationProviders",
              summary:
                "List the organization's chapter generation providers by name",
              responses: {
                200: describeJsonResponse(
                  "Chapter generation providers",
                  chapterGenerationProviderListSuccessResponseSchema
                ),
                ...describeApiErrorResponses(
                  CHAPTER_GENERATION_ROUTE_ERROR_DESCRIPTIONS.PROVIDER_LIST
                ),
              },
            }),
            validateRequest("param", organizationParamSchema),
            ...requireOwner,
            async (c) =>
              c.json(
                createApiSuccessResponse(
                  CHAPTER_GENERATION_SUCCESS_RESULTS.PROVIDER_LIST,
                  await chapterGenerationProvidersService.listProviders(
                    c.get("organizationAccess")
                  )
                ),
                200
              )
          )
          .post(
            "/:organizationSlug/chapter-generation-providers",
            describeRoute({
              tags: [OPENAPI_TAGS.CHAPTER_GENERATION_PROVIDERS],
              operationId: "createChapterGenerationProvider",
              summary:
                "Connect OpenAI, or a server of your own speaking OpenAI's chat completions API, to write chapters with gpt-6-luna",
              responses: {
                201: describeJsonResponse(
                  "Chapter generation provider created",
                  chapterGenerationProviderSuccessResponseSchema
                ),
                ...describeApiErrorResponses(
                  CHAPTER_GENERATION_ROUTE_ERROR_DESCRIPTIONS.PROVIDER_CREATE
                ),
              },
            }),
            validateRequest("param", organizationParamSchema),
            validateRequest("json", chapterGenerationProviderCreateBodySchema),
            ...requireOwner,
            async (c) =>
              c.json(
                createApiSuccessResponse(
                  CHAPTER_GENERATION_SUCCESS_RESULTS.PROVIDER_CREATE,
                  await chapterGenerationProvidersService.createProvider(
                    c.get("organizationAccess"),
                    c.get("activityActor"),
                    c.req.valid("json")
                  )
                ),
                201
              )
          )
          .put(
            "/:organizationSlug/chapter-generation-providers/:providerId",
            describeRoute({
              tags: [OPENAPI_TAGS.CHAPTER_GENERATION_PROVIDERS],
              operationId: "updateChapterGenerationProvider",
              summary:
                "Change a provider's name, address or API key; its kind and model stay",
              responses: {
                200: describeJsonResponse(
                  "Chapter generation provider saved",
                  chapterGenerationProviderSuccessResponseSchema
                ),
                ...describeApiErrorResponses(
                  CHAPTER_GENERATION_ROUTE_ERROR_DESCRIPTIONS.PROVIDER_WRITE
                ),
              },
            }),
            validateRequest("param", chapterGenerationProviderParamSchema),
            validateRequest("json", chapterGenerationProviderUpdateBodySchema),
            ...requireOwnedProvider,
            async (c) =>
              c.json(
                createApiSuccessResponse(
                  CHAPTER_GENERATION_SUCCESS_RESULTS.PROVIDER_UPDATE,
                  await chapterGenerationProvidersService.updateProvider(
                    c.get("chapterGenerationProvider"),
                    c.get("activityActor"),
                    c.req.valid("json")
                  )
                ),
                200
              )
          )
          .delete(
            "/:organizationSlug/chapter-generation-providers/:providerId",
            describeRoute({
              tags: [OPENAPI_TAGS.CHAPTER_GENERATION_PROVIDERS],
              operationId: "deleteChapterGenerationProvider",
              summary: "Delete a provider no library uses",
              responses: {
                200: describeJsonResponse(
                  "Chapter generation provider deleted",
                  libraryEmptySuccessResponseSchema
                ),
                ...describeApiErrorResponses(
                  CHAPTER_GENERATION_ROUTE_ERROR_DESCRIPTIONS.PROVIDER_WRITE
                ),
              },
            }),
            validateRequest("param", chapterGenerationProviderParamSchema),
            ...requireOwnedProvider,
            async (c) =>
              c.json(
                createApiSuccessResponse(
                  CHAPTER_GENERATION_SUCCESS_RESULTS.PROVIDER_DELETE,
                  await chapterGenerationProvidersService.deleteProvider(
                    c.get("chapterGenerationProvider"),
                    c.get("activityActor")
                  )
                ),
                200
              )
          )
          .post(
            "/:organizationSlug/chapter-generation-providers/:providerId/connection-tests",
            describeRoute({
              tags: [OPENAPI_TAGS.CHAPTER_GENERATION_PROVIDERS],
              operationId: "testChapterGenerationProvider",
              summary:
                "Check a saved provider answers and takes its API key, without generating anything",
              responses: {
                200: describeJsonResponse(
                  "Connection tested",
                  chapterGenerationConnectionTestSuccessResponseSchema
                ),
                ...describeApiErrorResponses(
                  CHAPTER_GENERATION_ROUTE_ERROR_DESCRIPTIONS.PROVIDER_WRITE
                ),
              },
            }),
            validateRequest("param", chapterGenerationProviderParamSchema),
            ...requireOwnedProvider,
            async (c) =>
              c.json(
                createApiSuccessResponse(
                  CHAPTER_GENERATION_SUCCESS_RESULTS.PROVIDER_TEST,
                  await chapterGenerationProvidersService.testProvider(
                    c.get("chapterGenerationProvider")
                  )
                ),
                200
              )
          )
      )
  )
}
