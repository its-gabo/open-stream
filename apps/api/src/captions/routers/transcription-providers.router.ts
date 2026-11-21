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
import { VIDEO_CAPTION_ROUTE_ERROR_DESCRIPTIONS } from "../constants/captions-openapi.constants"
import { VIDEO_CAPTION_SUCCESS_RESULTS } from "../dto/captions.responses"
import {
  transcriptionConnectionTestSuccessResponseSchema,
  transcriptionProviderCreateBodySchema,
  transcriptionProviderListSuccessResponseSchema,
  transcriptionProviderParamSchema,
  transcriptionProviderSuccessResponseSchema,
  transcriptionProviderUpdateBodySchema,
} from "../dto/captions.schemas"
import type { TranscriptionProvidersService } from "../services/transcription-providers.service"
import type { TranscriptionProviderEnv } from "../types/captions.types"
import { requireTranscriptionProvider } from "../middleware/transcription-provider-access.middleware"

type TranscriptionProvidersRouterDependencies = {
  authSessionService: AuthSessionService
  authCookieService: AuthCookieService
  organizationsService: OrganizationsService
  transcriptionProvidersService: TranscriptionProvidersService
}

/**
 * Transcription providers of an active organization; owner-only, as they
 * hold API keys. Every route requires a session. Mount at the API root.
 */
export function createTranscriptionProvidersRouter({
  authSessionService,
  authCookieService,
  organizationsService,
  transcriptionProvidersService,
}: TranscriptionProvidersRouterDependencies) {
  const requireOwner = [
    requireOrganizationMembership(organizationsService),
    requireActiveOrganization,
    requireOrganizationOwner,
  ] as const
  const requireOwnedProvider = [
    ...requireOwner,
    requireTranscriptionProvider(transcriptionProvidersService),
  ] as const

  return new Hono().route(
    "/organizations",
    new Hono<AuthenticatedEnv>()
      .use(requireSession(authSessionService, authCookieService))
      .route(
        "/",
        new Hono<TranscriptionProviderEnv>()
          .get(
            "/:organizationSlug/transcription-providers",
            describeRoute({
              tags: [OPENAPI_TAGS.TRANSCRIPTION_PROVIDERS],
              operationId: "listTranscriptionProviders",
              summary:
                "List the organization's transcription providers by name",
              responses: {
                200: describeJsonResponse(
                  "Transcription providers",
                  transcriptionProviderListSuccessResponseSchema
                ),
                ...describeApiErrorResponses(
                  VIDEO_CAPTION_ROUTE_ERROR_DESCRIPTIONS.PROVIDER_LIST
                ),
              },
            }),
            validateRequest("param", organizationParamSchema),
            ...requireOwner,
            async (c) =>
              c.json(
                createApiSuccessResponse(
                  VIDEO_CAPTION_SUCCESS_RESULTS.PROVIDER_LIST,
                  await transcriptionProvidersService.listProviders(
                    c.get("organizationAccess")
                  )
                ),
                200
              )
          )
          .post(
            "/:organizationSlug/transcription-providers",
            describeRoute({
              tags: [OPENAPI_TAGS.TRANSCRIPTION_PROVIDERS],
              operationId: "createTranscriptionProvider",
              summary:
                "Connect OpenAI, or a server of your own speaking OpenAI's transcription API",
              responses: {
                201: describeJsonResponse(
                  "Transcription provider created",
                  transcriptionProviderSuccessResponseSchema
                ),
                ...describeApiErrorResponses(
                  VIDEO_CAPTION_ROUTE_ERROR_DESCRIPTIONS.PROVIDER_CREATE
                ),
              },
            }),
            validateRequest("param", organizationParamSchema),
            validateRequest("json", transcriptionProviderCreateBodySchema),
            ...requireOwner,
            async (c) =>
              c.json(
                createApiSuccessResponse(
                  VIDEO_CAPTION_SUCCESS_RESULTS.PROVIDER_CREATE,
                  await transcriptionProvidersService.createProvider(
                    c.get("organizationAccess"),
                    c.get("activityActor"),
                    c.req.valid("json")
                  )
                ),
                201
              )
          )
          .put(
            "/:organizationSlug/transcription-providers/:providerId",
            describeRoute({
              tags: [OPENAPI_TAGS.TRANSCRIPTION_PROVIDERS],
              operationId: "updateTranscriptionProvider",
              summary:
                "Change a provider's name, address, model or API key; its kind stays",
              responses: {
                200: describeJsonResponse(
                  "Transcription provider saved",
                  transcriptionProviderSuccessResponseSchema
                ),
                ...describeApiErrorResponses(
                  VIDEO_CAPTION_ROUTE_ERROR_DESCRIPTIONS.PROVIDER_WRITE
                ),
              },
            }),
            validateRequest("param", transcriptionProviderParamSchema),
            validateRequest("json", transcriptionProviderUpdateBodySchema),
            ...requireOwnedProvider,
            async (c) =>
              c.json(
                createApiSuccessResponse(
                  VIDEO_CAPTION_SUCCESS_RESULTS.PROVIDER_UPDATE,
                  await transcriptionProvidersService.updateProvider(
                    c.get("transcriptionProvider"),
                    c.get("activityActor"),
                    c.req.valid("json")
                  )
                ),
                200
              )
          )
          .delete(
            "/:organizationSlug/transcription-providers/:providerId",
            describeRoute({
              tags: [OPENAPI_TAGS.TRANSCRIPTION_PROVIDERS],
              operationId: "deleteTranscriptionProvider",
              summary:
                "Delete a provider no library uses; tracks it wrote stay",
              responses: {
                200: describeJsonResponse(
                  "Transcription provider deleted",
                  libraryEmptySuccessResponseSchema
                ),
                ...describeApiErrorResponses(
                  VIDEO_CAPTION_ROUTE_ERROR_DESCRIPTIONS.PROVIDER_WRITE
                ),
              },
            }),
            validateRequest("param", transcriptionProviderParamSchema),
            ...requireOwnedProvider,
            async (c) =>
              c.json(
                createApiSuccessResponse(
                  VIDEO_CAPTION_SUCCESS_RESULTS.PROVIDER_DELETE,
                  await transcriptionProvidersService.deleteProvider(
                    c.get("transcriptionProvider"),
                    c.get("activityActor")
                  )
                ),
                200
              )
          )
          .post(
            "/:organizationSlug/transcription-providers/:providerId/connection-tests",
            describeRoute({
              tags: [OPENAPI_TAGS.TRANSCRIPTION_PROVIDERS],
              operationId: "testTranscriptionProvider",
              summary:
                "Check a saved provider answers and takes its API key, without transcribing anything",
              responses: {
                200: describeJsonResponse(
                  "Connection tested",
                  transcriptionConnectionTestSuccessResponseSchema
                ),
                ...describeApiErrorResponses(
                  VIDEO_CAPTION_ROUTE_ERROR_DESCRIPTIONS.PROVIDER_WRITE
                ),
              },
            }),
            validateRequest("param", transcriptionProviderParamSchema),
            ...requireOwnedProvider,
            async (c) =>
              c.json(
                createApiSuccessResponse(
                  VIDEO_CAPTION_SUCCESS_RESULTS.PROVIDER_TEST,
                  await transcriptionProvidersService.testProvider(
                    c.get("transcriptionProvider")
                  )
                ),
                200
              )
          )
      )
  )
}
