import { afterEach, beforeEach, describe, expect, it } from "bun:test"

import { createApiClient } from "../../../test/helpers/api-client"
import { createLogCapture } from "../../../test/helpers/log-capture"
import { TEST_WEB_ORIGIN, createTestApp } from "../../../test/helpers/test-app"
import { HTTP_ERROR_RESPONSES } from "../http/errors/http-error.constants"
import {
  FOREIGN_ORIGINS,
  STATE_CHANGING_ROUTES,
} from "./http-boundary.scenarios"

import type { TestApp } from "../../../test/helpers/test-app"

describe("HTTP boundary (e2e)", () => {
  let testApp: TestApp

  beforeEach(async () => {
    testApp = await createTestApp()
  })

  afterEach(() => testApp.close())

  describe("cross-site request forgery", () => {
    for (const route of STATE_CHANGING_ROUTES) {
      it.each(FOREIGN_ORIGINS)(
        `rejects POST ${route} from $description`,
        async ({ headers }) => {
          const response = await createApiClient(testApp).request(route, {
            method: "POST",
            body: {},
            headers,
          })

          expect(response.status).toBe(403)
          expect(await response.json()).toEqual(
            HTTP_ERROR_RESPONSES.ORIGIN_NOT_ALLOWED
          )
        }
      )
    }
  })

  describe("CORS", () => {
    it("allows credentialed requests from the web origin only", async () => {
      const allowed = await createApiClient(testApp).get("/auth/session")
      const foreign = await createApiClient(testApp).request("/auth/session", {
        headers: { origin: "https://evil.test" },
      })

      expect(allowed.headers.get("access-control-allow-origin")).toBe(
        TEST_WEB_ORIGIN
      )
      expect(allowed.headers.get("access-control-allow-credentials")).toBe(
        "true"
      )
      expect(foreign.headers.get("access-control-allow-origin")).toBeNull()
    })
  })

  describe("error responses", () => {
    it("answers unknown routes with a JSON 404", async () => {
      const response = await createApiClient(testApp).get("/unknown")

      expect(response.status).toBe(404)
      expect(await response.json()).toEqual(HTTP_ERROR_RESPONSES.NOT_FOUND)
    })

    it("hides unexpected failures behind a generic 500 and logs them", async () => {
      const logs = createLogCapture()
      const failingApp = await createTestApp(
        { LOG_LEVEL: "error" },
        { logSink: logs.sink }
      )

      await failingApp.close()

      const response = await createApiClient(failingApp).post(
        "/auth/forgot-password",
        { email: "ada@example.test" }
      )

      expect(response.status).toBe(500)
      expect(await response.json()).toEqual(HTTP_ERROR_RESPONSES.INTERNAL_ERROR)
      expect(
        logs.linesWith("Unhandled error while processing request")
      ).toHaveLength(1)
      expect(
        logs.linesWith("POST /api/v1/auth/forgot-password", "status=500")
      ).toHaveLength(1)
    })
  })

  it("documents every route in the OpenAPI schema", async () => {
    const response = await createApiClient(testApp).get("/openapi.json")
    const document = await response.json()

    const operationIds = Object.values(document.paths).flatMap((path) =>
      Object.values(path as Record<string, { operationId: string }>).map(
        (operation) => operation.operationId
      )
    )

    expect(response.status).toBe(200)
    expect(operationIds.sort()).toEqual([
      "acceptOrganizationInvitation",
      "cancelOrganizationDeletion",
      "cancelOrganizationDeletionByToken",
      "cancelOrganizationInvitation",
      "createLibrary",
      "createLibraryApiKey",
      "createLibraryApiPlaybackUrl",
      "createLibraryApiPlaylist",
      "createLibraryApiPlaylistPlaybackUrl",
      "createLibraryApiVideo",
      "createLibraryApiVideoCta",
      "createOrganization",
      "createPlaylist",
      "createStorage",
      "createTranscriptionProvider",
      "createVideo",
      "createVideoCta",
      "declineOrganizationInvitation",
      "deleteLead",
      "deleteLibraryApiKey",
      "deleteLibraryApiPlaylist",
      "deleteLibraryApiVideo",
      "deleteLibraryApiVideoCaption",
      "deleteLibraryApiVideoCta",
      "deleteLibraryWebhook",
      "deleteOrganizationByToken",
      "deletePlaylist",
      "deleteStorage",
      "deleteTranscriptionProvider",
      "deleteVideo",
      "deleteVideoCaption",
      "deleteVideoCta",
      "exportLeads",
      "getLibrary",
      "getLibraryAnalytics",
      "getLibraryApiAccess",
      "getLibraryApiAnalytics",
      "getLibraryApiPlaylist",
      "getLibraryApiPlaylistEmbed",
      "getLibraryApiVideo",
      "getLibraryApiVideoAnalytics",
      "getLibraryApiVideoEmbed",
      "getLibraryApiVideoEmbedCaptions",
      "getLibraryApiVideoEmbedCtas",
      "getLibraryApiVideoStatus",
      "getLibraryEncoding",
      "getLibraryPlayer",
      "getLibraryStorage",
      "getLibraryTranscriptionSettings",
      "getLibraryWebhook",
      "getOrganization",
      "getOrganizationAnalytics",
      "getOrganizationContext",
      "getOrganizationTeam",
      "getPlaylist",
      "getSession",
      "getStorage",
      "getVideo",
      "getVideoAnalytics",
      "getVideoCaptionFile",
      "getVideoHlsFile",
      "getVideoPoster",
      "getVideoThumbnail",
      "importLibraryApiVideo",
      "importVideo",
      "inviteOrganizationMember",
      "leaveOrganization",
      "listAccountActivity",
      "listLeads",
      "listLibraries",
      "listLibraryApiLeads",
      "listLibraryApiPlaylists",
      "listLibraryApiVideoCaptions",
      "listLibraryApiVideoCtas",
      "listLibraryApiVideos",
      "listLibraryWebhookDeliveries",
      "listOrganizationActivity",
      "listPlaylists",
      "listStorages",
      "listTranscriptionProviders",
      "listVideoCaptions",
      "listVideoCtas",
      "listVideos",
      "readLibraryApiVideoCaptionFile",
      "readLibraryApiVideoChapters",
      "readLibraryApiVideoHlsFile",
      "readLibraryApiVideoThumbnail",
      "removeOrganizationMember",
      "reportVideoCtaEvent",
      "reportVideoViewProgress",
      "reprocessLibraryApiVideo",
      "reprocessVideo",
      "requestLibraryApiVideoTranscription",
      "requestPasswordReset",
      "requestVideoTranscription",
      "resendLibraryWebhookDelivery",
      "resendOrganizationInvitation",
      "resetPassword",
      "rollLibraryApiKey",
      "rollLibraryWebhookSecret",
      "saveLibraryWebhook",
      "scheduleOrganizationDeletion",
      "selectOrganization",
      "sendLibraryWebhookTest",
      "signInWithEmail",
      "signOut",
      "signUpWithEmail",
      "startVideoView",
      "streamLibraryApiVideo",
      "submitVideoCtaLead",
      "suggestOrganizationSlug",
      "testSavedStorageConnection",
      "testStorageConnection",
      "testTranscriptionProvider",
      "transferOrganizationOwnership",
      "updateLibrary",
      "updateLibraryApiKey",
      "updateLibraryApiPlaylist",
      "updateLibraryApiPlaylistVideos",
      "updateLibraryApiVideo",
      "updateLibraryApiVideoCaption",
      "updateLibraryApiVideoChapters",
      "updateLibraryApiVideoCta",
      "updateLibraryApiVideoPoster",
      "updateLibraryEncoding",
      "updateLibraryPlayer",
      "updateLibrarySecurity",
      "updateLibraryStorage",
      "updateLibraryTranscriptionSettings",
      "updateOrganization",
      "updatePlaylist",
      "updatePlaylistVideos",
      "updateStorage",
      "updateTranscriptionProvider",
      "updateVideo",
      "updateVideoCaption",
      "updateVideoChapters",
      "updateVideoCta",
      "updateVideoPoster",
      "uploadLibraryApiVideoCaption",
      "uploadLibraryApiVideoPosterImage",
      "uploadVideoCaption",
      "uploadVideoPosterImage",
      "verifyEmail",
    ])
  })
})
