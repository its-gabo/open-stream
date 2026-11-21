import { Hono } from "hono"
import { describeRoute } from "hono-openapi"
import { OPENAPI_TAGS } from "../../common/http/openapi/openapi.constants"
import {
  describeApiErrorResponses,
  describeBinaryResponse,
  describeJsonResponse,
} from "../../common/http/openapi/openapi.utils"
import { createApiSuccessResponse } from "../../common/http/response/response.factory"
import { validateRequest } from "../../common/http/validation/validate-request"
import {
  libraryEmptySuccessResponseSchema,
  libraryParamSchema,
  videoParamSchema,
} from "../../libraries/dto/libraries.schemas"
import { requireLibrary } from "../../libraries/middleware/library-access.middleware"
import type { LibrariesService } from "../../libraries/services/libraries.service"
import type { LibraryEnv } from "../../libraries/types/libraries.types"
import {
  requireActiveOrganization,
  requireOrganizationMembership,
} from "../../organizations/middleware/organization-access.middleware"
import type { OrganizationsService } from "../../organizations/services/organizations.service"
import { LEAD_EXPORT_CONTENT_TYPE } from "../constants/ctas.constants"
import { VIDEO_CTA_ROUTE_ERROR_DESCRIPTIONS } from "../constants/ctas-openapi.constants"
import { VIDEO_CTA_SUCCESS_RESULTS } from "../dto/ctas.responses"
import {
  videoCtaBodySchema,
  videoCtaLeadExportQuerySchema,
  videoCtaLeadListQuerySchema,
  videoCtaLeadPageSuccessResponseSchema,
  videoCtaLeadParamSchema,
  videoCtaListSuccessResponseSchema,
  videoCtaParamSchema,
  videoCtaSuccessResponseSchema,
} from "../dto/ctas.schemas"
import type { VideoCtaLeadsService } from "../services/video-cta-leads.service"
import type { VideoCtasService } from "../services/video-ctas.service"

/** Calls to action of a library's videos and the leads they collected; every member of the active organization manages them. */
export function createVideoCtasRouter(
  organizationsService: OrganizationsService,
  librariesService: LibrariesService,
  videoCtasService: VideoCtasService,
  videoCtaLeadsService: VideoCtaLeadsService
) {
  const requireMemberOfLibrary = [
    requireOrganizationMembership(organizationsService),
    requireActiveOrganization,
    requireLibrary(librariesService),
  ] as const

  return new Hono<LibraryEnv>()
    .get(
      "/:organizationSlug/libraries/:libraryId/videos/:videoId/ctas",
      describeRoute({
        tags: [OPENAPI_TAGS.LIBRARIES],
        operationId: "listVideoCtas",
        summary:
          "List a video's calls to action: overlays by when they appear, then the end screen",
        responses: {
          200: describeJsonResponse(
            "Calls to action",
            videoCtaListSuccessResponseSchema
          ),
          ...describeApiErrorResponses(VIDEO_CTA_ROUTE_ERROR_DESCRIPTIONS.LIST),
        },
      }),
      validateRequest("param", videoParamSchema),
      ...requireMemberOfLibrary,
      async (c) =>
        c.json(
          createApiSuccessResponse(
            VIDEO_CTA_SUCCESS_RESULTS.LIST,
            await videoCtasService.listVideoCtas(
              c.get("library"),
              c.req.valid("param").videoId
            )
          ),
          200
        )
    )
    .post(
      "/:organizationSlug/libraries/:libraryId/videos/:videoId/ctas",
      describeRoute({
        tags: [OPENAPI_TAGS.LIBRARIES],
        operationId: "createVideoCta",
        summary:
          "Add a call to action to a processed video: a button or an email form, as an overlay or the end screen",
        responses: {
          201: describeJsonResponse(
            "Call to action created",
            videoCtaSuccessResponseSchema
          ),
          ...describeApiErrorResponses(
            VIDEO_CTA_ROUTE_ERROR_DESCRIPTIONS.CREATE
          ),
        },
      }),
      validateRequest("param", videoParamSchema),
      validateRequest("json", videoCtaBodySchema),
      ...requireMemberOfLibrary,
      async (c) =>
        c.json(
          createApiSuccessResponse(
            VIDEO_CTA_SUCCESS_RESULTS.CREATE,
            await videoCtasService.createVideoCta(
              c.get("library"),
              c.get("activityActor"),
              c.req.valid("param").videoId,
              c.req.valid("json")
            )
          ),
          201
        )
    )
    .put(
      "/:organizationSlug/libraries/:libraryId/videos/:videoId/ctas/:ctaId",
      describeRoute({
        tags: [OPENAPI_TAGS.LIBRARIES],
        operationId: "updateVideoCta",
        summary:
          "Replace a call to action's fields; its view counts and leads stay with it",
        responses: {
          200: describeJsonResponse(
            "Call to action saved",
            videoCtaSuccessResponseSchema
          ),
          ...describeApiErrorResponses(
            VIDEO_CTA_ROUTE_ERROR_DESCRIPTIONS.WRITE
          ),
        },
      }),
      validateRequest("param", videoCtaParamSchema),
      validateRequest("json", videoCtaBodySchema),
      ...requireMemberOfLibrary,
      async (c) =>
        c.json(
          createApiSuccessResponse(
            VIDEO_CTA_SUCCESS_RESULTS.UPDATE,
            await videoCtasService.updateVideoCta(
              c.get("library"),
              c.get("activityActor"),
              c.req.valid("param"),
              c.req.valid("json")
            )
          ),
          200
        )
    )
    .delete(
      "/:organizationSlug/libraries/:libraryId/videos/:videoId/ctas/:ctaId",
      describeRoute({
        tags: [OPENAPI_TAGS.LIBRARIES],
        operationId: "deleteVideoCta",
        summary:
          "Delete a call to action and its view counts; leads left in it stay",
        responses: {
          200: describeJsonResponse(
            "Call to action deleted",
            libraryEmptySuccessResponseSchema
          ),
          ...describeApiErrorResponses(
            VIDEO_CTA_ROUTE_ERROR_DESCRIPTIONS.WRITE
          ),
        },
      }),
      validateRequest("param", videoCtaParamSchema),
      ...requireMemberOfLibrary,
      async (c) => {
        await videoCtasService.deleteVideoCta(
          c.get("library"),
          c.get("activityActor"),
          c.req.valid("param")
        )

        return c.json(
          createApiSuccessResponse(VIDEO_CTA_SUCCESS_RESULTS.DELETE, {}),
          200
        )
      }
    )
    .get(
      "/:organizationSlug/libraries/:libraryId/leads",
      describeRoute({
        tags: [OPENAPI_TAGS.LIBRARIES],
        operationId: "listLeads",
        summary:
          "List the email addresses viewers left in the library's calls to action, newest first",
        responses: {
          200: describeJsonResponse(
            "Leads",
            videoCtaLeadPageSuccessResponseSchema
          ),
          ...describeApiErrorResponses(
            VIDEO_CTA_ROUTE_ERROR_DESCRIPTIONS.LEAD_LIST
          ),
        },
      }),
      validateRequest("param", libraryParamSchema),
      validateRequest("query", videoCtaLeadListQuerySchema),
      ...requireMemberOfLibrary,
      async (c) =>
        c.json(
          createApiSuccessResponse(
            VIDEO_CTA_SUCCESS_RESULTS.LEAD_LIST,
            await videoCtaLeadsService.listLeadPage(
              c.get("library"),
              c.req.valid("query")
            )
          ),
          200
        )
    )
    .get(
      "/:organizationSlug/libraries/:libraryId/leads/export",
      describeRoute({
        tags: [OPENAPI_TAGS.LIBRARIES],
        operationId: "exportLeads",
        summary:
          "Download the library's leads, or one video's, as a CSV file; the export is recorded in the activity log",
        responses: {
          200: describeBinaryResponse(
            "The leads as CSV",
            LEAD_EXPORT_CONTENT_TYPE
          ),
          ...describeApiErrorResponses(
            VIDEO_CTA_ROUTE_ERROR_DESCRIPTIONS.LEAD_LIST
          ),
        },
      }),
      validateRequest("param", libraryParamSchema),
      validateRequest("query", videoCtaLeadExportQuerySchema),
      ...requireMemberOfLibrary,
      async (c) => {
        const { fileName, csv } = await videoCtaLeadsService.exportLeads(
          c.get("library"),
          c.get("activityActor"),
          c.req.valid("query")
        )

        return new Response(csv, {
          status: 200,
          headers: {
            "Content-Type": LEAD_EXPORT_CONTENT_TYPE,
            "Content-Disposition": `attachment; filename="${fileName}"`,
            "Cache-Control": "no-store",
          },
        })
      }
    )
    .delete(
      "/:organizationSlug/libraries/:libraryId/leads/:leadId",
      describeRoute({
        tags: [OPENAPI_TAGS.LIBRARIES],
        operationId: "deleteLead",
        summary:
          "Delete a lead for good; the activity log keeps no email address",
        responses: {
          200: describeJsonResponse(
            "Lead deleted",
            libraryEmptySuccessResponseSchema
          ),
          ...describeApiErrorResponses(
            VIDEO_CTA_ROUTE_ERROR_DESCRIPTIONS.LEAD_DELETE
          ),
        },
      }),
      validateRequest("param", videoCtaLeadParamSchema),
      ...requireMemberOfLibrary,
      async (c) => {
        await videoCtaLeadsService.deleteLead(
          c.get("library"),
          c.get("activityActor"),
          c.req.valid("param").leadId
        )

        return c.json(
          createApiSuccessResponse(VIDEO_CTA_SUCCESS_RESULTS.LEAD_DELETE, {}),
          200
        )
      }
    )
}
