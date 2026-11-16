import type { LibraryApiKeyScope } from "@workspace/shared"
import { eq } from "drizzle-orm"
import { afterEach, beforeEach, describe, expect, it } from "bun:test"

import { createLibraryFactory } from "../../../test/factory/library.factory"
import { createOrganizationFactory } from "../../../test/factory/organization.factory"
import { createUserFactory } from "../../../test/factory/user.factory"
import { signInAsUser } from "../../../test/helpers/api-client"
import { createLibraryApiClient } from "../../../test/helpers/library-api-client"
import { createTestApp } from "../../../test/helpers/test-app"
import { createTusClient } from "../../../test/helpers/tus"
import {
  VIDEO_FILE_HEADERS,
  createFileBytes,
} from "../../../test/helpers/video-files"
import { libraryApiKeys } from "../../db/schema"
import {
  ALLOWED_PLAYBACK_REQUESTS,
  ALL_SCOPES,
  BLOCKED_PLAYBACK_REQUESTS,
  BYTE_RANGES,
  REJECTED_API_KEY_BODIES,
  REJECTED_SECURITY_BODIES,
  SCOPED_REQUESTS,
} from "./library-api.scenarios"

import type { UserCredentials } from "../../../test/factory/user.factory"
import type { ApiClient } from "../../../test/helpers/api-client"
import type { TestApp } from "../../../test/helpers/test-app"
import type {
  LibraryApiKeyDto,
  LibraryDto,
  VideoDto,
} from "../dto/libraries.schemas"

const FILE_SIZE = 4096

describe("Library API (e2e)", () => {
  let testApp: TestApp
  let owner: UserCredentials
  let ownerClient: ApiClient
  let memberClient: ApiClient
  let library: LibraryDto
  let libraryPath: string
  let apiPath: string

  beforeEach(async () => {
    testApp = await createTestApp()
    owner = await createUserFactory(testApp).create()
    const member = await createUserFactory(testApp).create()

    await createOrganizationFactory(testApp)
      .ownedBy(owner)
      .withMembers(member)
      .create({ name: "Acme", slug: "acme" })
    library = await createLibraryFactory(testApp)
      .inOrganization("acme", owner)
      .create({ name: "Marketing" })
    libraryPath = `/organizations/acme/libraries/${library.id}`
    apiPath = `/libraries/${library.id}`
    ownerClient = await signInAsUser(testApp, owner)
    memberClient = await signInAsUser(testApp, member)
  })

  afterEach(() => testApp.close())

  /** Creates a key and returns its secret and description. */
  const createKey = async (
    scopes: LibraryApiKeyScope[] = ALL_SCOPES,
    name = "Server"
  ): Promise<{ secret: string; apiKey: LibraryApiKeyDto }> =>
    (
      await (
        await ownerClient.post(`${libraryPath}/api-keys`, { name, scopes })
      ).json()
    ).data

  const createApiKey = async (scopes?: LibraryApiKeyScope[]) =>
    (await createKey(scopes)).secret

  const updateSecurity = (security: {
    allowedPlaybackHosts: string[]
    requireSignedPlayback: boolean
  }) => ownerClient.put(`${libraryPath}/security`, security)

  /** A video with an uploaded file, created and uploaded with the API key. */
  const uploadVideo = async (apiClient: ApiClient) => {
    const { video } = (
      await (
        await apiClient.post(`${apiPath}/videos`, { title: "Keynote" })
      ).json()
    ).data
    const bytes = createFileBytes(VIDEO_FILE_HEADERS.MP4, FILE_SIZE)
    const response = await createTusClient(
      apiClient,
      `${apiPath}/videos/${video.id}`
    ).upload(bytes, "keynote.mp4", FILE_SIZE)

    expect(response.status).toBe(204)

    return { videoId: video.id as string, bytes }
  }

  const streamPath = (videoId: string) => `${apiPath}/videos/${videoId}/stream`

  describe("API keys", () => {
    it("shows the secret once and keeps only its hash", async () => {
      const response = await ownerClient.post(`${libraryPath}/api-keys`, {
        name: "  Ingest server ",
        scopes: ["videos:upload", "videos:read", "videos:upload"],
      })
      const { secret, apiKey } = (await response.json()).data
      const access = (
        await (await ownerClient.get(`${libraryPath}/api-access`)).json()
      ).data.apiAccess
      const [row] = await testApp.appModule.db
        .select()
        .from(libraryApiKeys)
        .where(eq(libraryApiKeys.libraryId, library.id))

      expect(response.status).toBe(201)
      expect(secret).toStartWith("osk_")
      expect(apiKey).toEqual({
        id: expect.any(String),
        name: "Ingest server",
        hint: secret.slice(-4),
        scopes: ["videos:upload", "videos:read"],
        createdAt: expect.any(String),
        lastUsedAt: null,
      })
      expect(access).toEqual({
        libraryId: library.id,
        apiUrl: `https://app.openstream.test/api/v1/libraries/${library.id}`,
        apiKeys: [apiKey],
        security: { allowedPlaybackHosts: [], requireSignedPlayback: false },
      })
      expect(JSON.stringify(access)).not.toContain(secret)
      expect(JSON.stringify(row)).not.toContain(secret)
    })

    it("accepts every key of the library at once", async () => {
      const secrets = [await createApiKey(), await createApiKey()]

      const responses = await Promise.all(
        secrets.map((secret) =>
          createLibraryApiClient(testApp, secret).get(`${apiPath}/videos`)
        )
      )

      expect(responses.map((response) => response.status)).toEqual([200, 200])
    })

    it("records when each key was last used", async () => {
      const used = await createKey()
      const unused = await createKey()

      await createLibraryApiClient(testApp, used.secret).get(
        `${apiPath}/videos`
      )
      const { apiKeys } = (
        await (await ownerClient.get(`${libraryPath}/api-access`)).json()
      ).data.apiAccess

      expect(
        apiKeys.map(({ id, lastUsedAt }: LibraryApiKeyDto) => ({
          id,
          isUsed: lastUsedAt !== null,
        }))
      ).toEqual([
        { id: used.apiKey.id, isUsed: true },
        { id: unused.apiKey.id, isUsed: false },
      ])
    })

    it.each(SCOPED_REQUESTS)(
      "needs $scope to $description",
      async ({ scope, method, path, body }) => {
        const otherScopes = ALL_SCOPES.filter((each) => each !== scope)
        const { video } = (
          await (
            await createLibraryApiClient(testApp, await createApiKey()).post(
              `${apiPath}/videos`,
              { title: "Existing" }
            )
          ).json()
        ).data
        const url = `${apiPath}${path.replace(":videoId", video.id)}`
        const send = async (secret: string) =>
          createLibraryApiClient(testApp, secret).request(url, {
            method,
            body,
          })

        const withoutScope = await send(await createApiKey(otherScopes))
        const withScope = await send(await createApiKey([scope]))

        expect(withoutScope.status).toBe(403)
        expect((await withoutScope.json()).code).toBe(
          "library.api_key.scope_missing"
        )
        expect(withScope.status).toBeLessThan(300)
      }
    )

    it("needs videos:upload to upload with tus", async () => {
      const { video } = (
        await (
          await createLibraryApiClient(testApp, await createApiKey()).post(
            `${apiPath}/videos`,
            { title: "Clip" }
          )
        ).json()
      ).data
      const createUploadWith = async (scopes: LibraryApiKeyScope[]) =>
        createTusClient(
          createLibraryApiClient(testApp, await createApiKey(scopes)),
          `${apiPath}/videos/${video.id}`
        ).create(FILE_SIZE, "clip.mp4")

      const readOnly = await createUploadWith(["videos:read"])
      const uploader = await createUploadWith(["videos:upload"])

      expect([readOnly.status, uploader.status]).toEqual([403, 201])
    })

    it("applies changed scopes and names right away", async () => {
      const { secret, apiKey } = await createKey(["videos:read"])
      const client = createLibraryApiClient(testApp, secret)
      const before = await client.post(`${apiPath}/videos`, { title: "A" })

      const updated = await ownerClient.patch(
        `${libraryPath}/api-keys/${apiKey.id}`,
        { name: "Uploader", scopes: ["videos:upload"] }
      )
      const created = await client.post(`${apiPath}/videos`, { title: "B" })
      const listed = await client.get(`${apiPath}/videos`)

      expect((await updated.json()).data.apiKey).toEqual(
        expect.objectContaining({ name: "Uploader", scopes: ["videos:upload"] })
      )
      expect([before.status, created.status, listed.status]).toEqual([
        403, 201, 403,
      ])
    })

    it("rolls a key to a new secret, keeping its name and scopes", async () => {
      const { secret, apiKey } = await createKey(["videos:read"], "Reporting")

      const response = await ownerClient.post(
        `${libraryPath}/api-keys/${apiKey.id}/roll`
      )
      const rolled = (await response.json()).data
      const oldSecret = await createLibraryApiClient(testApp, secret).get(
        `${apiPath}/videos`
      )
      const newSecret = await createLibraryApiClient(
        testApp,
        rolled.secret
      ).get(`${apiPath}/videos`)

      expect(rolled.apiKey).toEqual(
        expect.objectContaining({
          id: apiKey.id,
          name: "Reporting",
          scopes: ["videos:read"],
          hint: rolled.secret.slice(-4),
        })
      )
      expect([oldSecret.status, newSecret.status]).toEqual([401, 200])
    })

    it("revokes one key without touching the others", async () => {
      const revoked = await createKey()
      const kept = await createKey()

      const response = await ownerClient.delete(
        `${libraryPath}/api-keys/${revoked.apiKey.id}`
      )
      const responses = await Promise.all(
        [revoked.secret, kept.secret].map((secret) =>
          createLibraryApiClient(testApp, secret).get(`${apiPath}/videos`)
        )
      )

      expect(response.status).toBe(200)
      expect(responses.map(({ status }) => status)).toEqual([401, 200])
    })

    it("limits how many keys a library has", async () => {
      for (let index = 0; index < 25; index += 1) await createApiKey()

      const response = await ownerClient.post(`${libraryPath}/api-keys`, {
        name: "One too many",
        scopes: ["videos:read"],
      })

      expect(response.status).toBe(409)
      expect((await response.json()).code).toBe("library.api_key.limit_reached")
    })

    it.each(REJECTED_API_KEY_BODIES)(
      "rejects a key with $description",
      async ({ body }) => {
        const response = await ownerClient.post(`${libraryPath}/api-keys`, body)

        expect(response.status).toBe(422)
      }
    )

    it("accepts a key only for its own library", async () => {
      const otherLibrary = await createLibraryFactory(testApp)
        .inOrganization("acme", owner)
        .create()
      const { secret, apiKey } = await createKey()

      const apiRequest = await createLibraryApiClient(testApp, secret).get(
        `/libraries/${otherLibrary.id}/videos`
      )
      const deleteThroughOtherLibrary = await ownerClient.delete(
        `/organizations/acme/libraries/${otherLibrary.id}/api-keys/${apiKey.id}`
      )

      expect(apiRequest.status).toBe(401)
      expect((await apiRequest.json()).code).toBe("library.api_key.invalid")
      expect(deleteThroughOtherLibrary.status).toBe(404)
    })

    it.each([
      { description: "no key", authorization: undefined },
      { description: "a wrong key", authorization: "Bearer osk_wrong" },
      { description: "another scheme", authorization: "Basic osk_wrong" },
    ])("rejects $description", async ({ authorization }) => {
      await createApiKey()

      const response = await createLibraryApiClient(testApp).request(
        `${apiPath}/videos`,
        { headers: authorization ? { authorization } : {} }
      )

      expect(response.status).toBe(401)
    })

    it("does not accept a session in place of a key", async () => {
      await createApiKey()

      const response = await ownerClient.get(`${apiPath}/videos`)

      expect(response.status).toBe(401)
    })

    it("keeps API access settings away from members", async () => {
      const { apiKey } = await createKey()
      const keyPath = `${libraryPath}/api-keys/${apiKey.id}`

      const responses = await Promise.all([
        memberClient.get(`${libraryPath}/api-access`),
        memberClient.post(`${libraryPath}/api-keys`, {
          name: "Mine",
          scopes: ["videos:read"],
        }),
        memberClient.patch(keyPath, { name: "Mine" }),
        memberClient.post(`${keyPath}/roll`),
        memberClient.delete(keyPath),
        memberClient.put(`${libraryPath}/security`, {
          allowedPlaybackHosts: [],
          requireSignedPlayback: false,
        }),
      ])

      expect(responses.map((response) => response.status)).toEqual([
        403, 403, 403, 403, 403, 403,
      ])
    })
  })

  describe("videos", () => {
    let apiClient: ApiClient

    beforeEach(async () => {
      apiClient = createLibraryApiClient(testApp, await createApiKey())
    })

    it("manages videos without a browser origin", async () => {
      const created = await apiClient.post(`${apiPath}/videos`, {
        title: "Keynote",
      })
      const { video } = (await created.json()).data
      const renamed = await apiClient.patch(`${apiPath}/videos/${video.id}`, {
        title: "Opening keynote",
      })
      const read = await apiClient.get(`${apiPath}/videos/${video.id}`)
      const deleted = await apiClient.delete(`${apiPath}/videos/${video.id}`)

      expect(created.status).toBe(201)
      expect((await renamed.json()).data.video.title).toBe("Opening keynote")
      expect(read.status).toBe(200)
      expect(deleted.status).toBe(200)
      expect(
        (await apiClient.get(`${apiPath}/videos/${video.id}`)).status
      ).toBe(404)
    })

    it("pages and searches videos, newest first", async () => {
      for (const title of ["Intro", "Keynote day 1", "Keynote day 2"]) {
        await apiClient.post(`${apiPath}/videos`, { title })
      }

      const page = (
        await (
          await apiClient.get(`${apiPath}/videos?search=keynote&pageSize=1`)
        ).json()
      ).data

      expect(page.videos.map(({ title }: VideoDto) => title)).toEqual([
        "Keynote day 2",
      ])
      expect(page.pagination).toEqual({
        page: 1,
        pageSize: 1,
        totalItems: 2,
        totalPages: 2,
      })
    })

    it("uploads a file with tus under the library API", async () => {
      const { videoId, bytes } = await uploadVideo(apiClient)
      const { video } = (
        await (await apiClient.get(`${apiPath}/videos/${videoId}`)).json()
      ).data

      expect(video).toEqual(
        expect.objectContaining({ status: "uploaded", sizeBytes: FILE_SIZE })
      )
      expect(
        testApp.objectStorage.readObject(
          testApp.appModule.defaultStorageLocation,
          `${await organizationIdOf()}/${library.id}/${videoId}/source`
        )
      ).toEqual(bytes)
    })

    it("points the tus upload location at the library API", async () => {
      const { video } = (
        await (
          await apiClient.post(`${apiPath}/videos`, { title: "Clip" })
        ).json()
      ).data

      const response = await createTusClient(
        apiClient,
        `${apiPath}/videos/${video.id}`
      ).create(FILE_SIZE, "clip.mp4")

      expect(response.status).toBe(201)
      expect(response.headers.get("location")).toStartWith(
        `/api/v1${apiPath}/videos/${video.id}/uploads/`
      )
    })

    it("lets other origins call the API, as it uses no cookies", async () => {
      const response = await apiClient.request(`${apiPath}/videos`, {
        method: "OPTIONS",
        headers: {
          origin: "https://customer.example",
          "access-control-request-method": "POST",
          "access-control-request-headers": "authorization, content-type",
        },
      })

      expect(response.status).toBe(204)
      expect(response.headers.get("access-control-allow-origin")).toBe("*")
    })
  })

  const organizationIdOf = async () =>
    (await (await ownerClient.get("/organizations/acme")).json()).data
      .organization.id as string

  describe("streaming", () => {
    let apiKey: string
    let apiClient: ApiClient
    let videoId: string
    let bytes: Uint8Array<ArrayBuffer>
    let viewer: ApiClient

    beforeEach(async () => {
      apiKey = await createApiKey()
      apiClient = createLibraryApiClient(testApp, apiKey)
      ;({ videoId, bytes } = await uploadVideo(apiClient))
      viewer = createLibraryApiClient(testApp)
    })

    const signedStreamPath = async (expiresInSeconds?: number) => {
      const { playback } = (
        await (
          await apiClient.post(
            `${apiPath}/videos/${videoId}/playback-urls`,
            expiresInSeconds ? { expiresInSeconds } : {}
          )
        ).json()
      ).data
      const url = new URL(playback.originalUrl)

      return `${url.pathname.slice("/api/v1".length)}${url.search}`
    }

    it("streams the whole file without a key", async () => {
      const response = await viewer.get(streamPath(videoId))

      expect(response.status).toBe(200)
      expect(response.headers.get("content-type")).toBe("video/mp4")
      expect(response.headers.get("accept-ranges")).toBe("bytes")
      expect(response.headers.get("content-length")).toBe(String(FILE_SIZE))
      expect(response.headers.get("access-control-allow-origin")).toBe("*")
      expect(new Uint8Array(await response.arrayBuffer())).toEqual(bytes)
    })

    it.each(BYTE_RANGES)(
      "serves the range $range",
      async ({ range, start, end }) => {
        const response = await viewer.request(streamPath(videoId), {
          headers: { range },
        })

        expect(response.status).toBe(206)
        expect(response.headers.get("content-range")).toBe(
          `bytes ${start}-${end}/${FILE_SIZE}`
        )
        expect(new Uint8Array(await response.arrayBuffer())).toEqual(
          bytes.slice(start, end + 1)
        )
      }
    )

    it("rejects a range outside the file", async () => {
      const response = await viewer.request(streamPath(videoId), {
        headers: { range: `bytes=${FILE_SIZE}-` },
      })

      expect(response.status).toBe(416)
    })

    it("answers HEAD with the headers only", async () => {
      const response = await viewer.request(streamPath(videoId), {
        method: "HEAD",
      })

      expect(response.status).toBe(200)
      expect(response.headers.get("content-length")).toBe(String(FILE_SIZE))
      expect(await response.text()).toBe("")
    })

    it("reports a video without a file as not ready", async () => {
      const { video } = (
        await (
          await apiClient.post(`${apiPath}/videos`, { title: "Draft" })
        ).json()
      ).data

      const response = await viewer.get(streamPath(video.id))

      expect(response.status).toBe(409)
      expect((await response.json()).code).toBe("video.not_ready")
    })

    describe("allowed hosts", () => {
      beforeEach(async () => {
        await updateSecurity({
          allowedPlaybackHosts: ["customer.example", "*.cdn.example"],
          requireSignedPlayback: false,
        })
      })

      it.each(ALLOWED_PLAYBACK_REQUESTS)(
        "plays for $description",
        async ({ headers }) => {
          const response = await viewer.request(streamPath(videoId), {
            headers,
          })

          expect(response.status).toBe(200)
        }
      )

      it.each(BLOCKED_PLAYBACK_REQUESTS)(
        "blocks $description",
        async ({ headers }) => {
          const response = await viewer.request(streamPath(videoId), {
            headers,
          })

          expect(response.status).toBe(403)
          expect((await response.json()).code).toBe(
            "video.playback.host_not_allowed"
          )
        }
      )
    })

    describe("signed playback", () => {
      beforeEach(async () => {
        await updateSecurity({
          allowedPlaybackHosts: [],
          requireSignedPlayback: true,
        })
      })

      it("plays a signed URL", async () => {
        const response = await viewer.get(await signedStreamPath())

        expect(response.status).toBe(200)
      })

      it("blocks unsigned, tampered and other videos' URLs", async () => {
        const signedPath = await signedStreamPath()
        const { video } = (
          await (
            await apiClient.post(`${apiPath}/videos`, { title: "Other" })
          ).json()
        ).data

        const responses = await Promise.all([
          viewer.get(streamPath(videoId)),
          viewer.get(signedPath.replace(/expires=\d+/, "expires=9999999999")),
          viewer.get(signedPath.replace(videoId, video.id)),
        ])

        expect(responses.map((response) => response.status)).toEqual([
          403, 403, 403,
        ])
      })

      it("blocks an expired URL", async () => {
        const signedPath = await signedStreamPath(60)
        const realNow = Date.now

        Date.now = () => realNow() + 61_000

        try {
          const response = await viewer.get(signedPath)

          expect(response.status).toBe(403)
          expect((await response.json()).code).toBe(
            "video.playback.signature_invalid"
          )
        } finally {
          Date.now = realNow
        }
      })

      it("revokes signed URLs when their key is rolled or deleted", async () => {
        const signedPath = await signedStreamPath()
        const { apiKeys } = (
          await (await ownerClient.get(`${libraryPath}/api-access`)).json()
        ).data.apiAccess
        const signingKeyId = apiKeys[0].id

        await createApiKey()
        const afterOtherKeyCreated = await viewer.get(signedPath)
        await ownerClient.post(`${libraryPath}/api-keys/${signingKeyId}/roll`)
        const afterRoll = await viewer.get(signedPath)

        expect([afterOtherKeyCreated.status, afterRoll.status]).toEqual([
          200, 403,
        ])
      })

      it("revokes signed URLs when their key loses playback:sign", async () => {
        const signedPath = await signedStreamPath()
        const { apiKeys } = (
          await (await ownerClient.get(`${libraryPath}/api-access`)).json()
        ).data.apiAccess

        await ownerClient.patch(`${libraryPath}/api-keys/${apiKeys[0].id}`, {
          scopes: ["videos:read"],
        })

        expect((await viewer.get(signedPath)).status).toBe(403)
      })
    })

    it.each(REJECTED_SECURITY_BODIES)(
      "rejects $description in the security settings",
      async ({ body }) => {
        const response = await ownerClient.put(`${libraryPath}/security`, {
          requireSignedPlayback: false,
          ...body,
        })

        expect(response.status).toBe(422)
      }
    )

    it("normalizes allowed hosts", async () => {
      const response = await updateSecurity({
        allowedPlaybackHosts: [" Customer.Example ", "customer.example"],
        requireSignedPlayback: false,
      })

      expect(
        (await response.json()).data.apiAccess.security.allowedPlaybackHosts
      ).toEqual(["customer.example"])
    })
  })
})
