import { afterAll, afterEach, describe, expect, it, spyOn } from "bun:test"
import * as dns from "node:dns"
import { VIDEO_UPLOAD_LIMITS } from "@workspace/shared"
import { eq } from "drizzle-orm"
import { match } from "ts-pattern"

import { createLibraryFactory } from "../../../test/factory/library.factory"
import { createOrganizationFactory } from "../../../test/factory/organization.factory"
import { createUserFactory } from "../../../test/factory/user.factory"
import { signInAsUser } from "../../../test/helpers/api-client"
import {
  startFileServer,
  startRawHttpServer,
} from "../../../test/helpers/file-server"
import { createLibraryApiClient } from "../../../test/helpers/library-api-client"
import {
  findVideoImportRequests,
  findVideoProcessingRequests,
} from "../../../test/helpers/outbox"
import { createTestApp } from "../../../test/helpers/test-app"
import { createTusClient } from "../../../test/helpers/tus"
import {
  VIDEO_FILE_HEADERS,
  createFileBytes,
} from "../../../test/helpers/video-files"
import { videoImports, videos, webhookDeliveries } from "../../db/schema"
import { VideoImportError } from "../errors/video-import.error"
import {
  FAILED_IMPORTS,
  IMPORT_SOURCES,
  INVALID_IMPORT_URLS,
  PRIVATE_IMPORT_URLS,
} from "./video-imports.scenarios"

import type { ApiClient } from "../../../test/helpers/api-client"
import type { TestApp } from "../../../test/helpers/test-app"
import type { ActivityLogDto } from "../../activity/dto/activity.schemas"
import type { LibraryDto, VideoDto } from "../dto/libraries.schemas"

const MIB = 1024 * 1024

const fileResponse = (bytes: Uint8Array<ArrayBuffer>) =>
  new Response(bytes, {
    headers: { "content-type": "application/octet-stream" },
  })

describe("Video imports (e2e)", () => {
  let testApp: TestApp
  let ownerClient: ApiClient
  let memberClient: ApiClient
  let library: LibraryDto
  let libraryPath: string
  let fileServer: ReturnType<typeof startFileServer>

  const clipBytes = createFileBytes(VIDEO_FILE_HEADERS.MP4, 1024)
  /** Claims a file just over the limit; `Bun.serve` would send the real length. */
  const oversizedServer = startRawHttpServer(
    `HTTP/1.1 200 OK\r\nContent-Length: ${VIDEO_UPLOAD_LIMITS.MAX_FILE_SIZE_BYTES + 1}`,
    clipBytes,
    { isLeftOpen: true }
  )
  /** Promises more bytes than it sends before closing the connection. */
  const truncatingServer = startRawHttpServer(
    `HTTP/1.1 200 OK\r\nContent-Length: ${clipBytes.byteLength * 4}`,
    clipBytes
  )

  const setUp = async (
    routes: Parameters<typeof startFileServer>[0] = {},
    configOverrides: Record<string, string> = {}
  ) => {
    fileServer = startFileServer({
      "/clip.mp4": () => fileResponse(clipBytes),
      ...routes,
    })
    testApp = await createTestApp(configOverrides)

    const owner = await createUserFactory(testApp).create()
    const member = await createUserFactory(testApp).create()

    await createOrganizationFactory(testApp)
      .ownedBy(owner)
      .withMembers(member)
      .create({ name: "Acme", slug: "acme" })
    library = await createLibraryFactory(testApp)
      .inOrganization("acme", owner)
      .create({ name: "Marketing" })
    libraryPath = `/organizations/acme/libraries/${library.id}`
    ownerClient = await signInAsUser(testApp, owner)
    memberClient = await signInAsUser(testApp, member)
  }

  afterEach(async () => {
    fileServer.stop()
    await testApp.close()
  })

  afterAll(() => {
    oversizedServer.stop()
    truncatingServer.stop()
  })

  const createVideo = async (): Promise<VideoDto> =>
    (
      await (
        await memberClient.post(`${libraryPath}/videos`, { title: "Clip" })
      ).json()
    ).data.video

  const startImport = (videoId: string, url: string) =>
    memberClient.post(`${libraryPath}/videos/${videoId}/import`, { url })

  const readVideo = async (videoId: string): Promise<VideoDto> =>
    (await (await memberClient.get(`${libraryPath}/videos/${videoId}`)).json())
      .data.video

  const latestImportRequest = async (videoId: string) => {
    const request = (await findVideoImportRequests(testApp))
      .filter((payload) => payload.videoId === videoId)
      .at(-1)

    if (!request) throw new Error(`No import was queued for ${videoId}`)

    return request
  }

  /** Runs one attempt of the newest import of the video, as the worker would. */
  const runImport = async (videoId: string, isFinalAttempt = true) =>
    testApp.appModule.videoImportsService.importVideo(
      await latestImportRequest(videoId),
      { isFinalAttempt }
    )

  const importFailure = async (attempt: Promise<unknown>) => {
    const error = await attempt.then(
      () => null,
      (rejection: unknown) => rejection
    )

    if (!(error instanceof VideoImportError)) {
      throw new Error(`The import did not fail with a VideoImportError`)
    }

    return error
  }

  const sourceObjectKey = async (videoId: string) => {
    const [row] = await testApp.appModule.db
      .select({ sourceObjectKey: videos.sourceObjectKey })
      .from(videos)
      .where(eq(videos.id, videoId))

    return row?.sourceObjectKey ?? null
  }

  const countVideoImports = () => testApp.appModule.db.$count(videoImports)

  const readStoredFile = async (videoId: string) =>
    testApp.objectStorage.readObject(
      testApp.appModule.defaultStorageLocation,
      (await sourceObjectKey(videoId))!
    )

  describe("starting", () => {
    it("records the import and queues it, showing only the URL's host", async () => {
      await setUp()
      const video = await createVideo()
      const url = `${fileServer.url("/media/Team%20call.mp4")}?token=secret`

      const response = await startImport(video.id, url)
      const body = await response.json()

      expect(response.status).toBe(202)
      expect(body.data.video).toEqual(
        expect.objectContaining({
          status: "uploading",
          fileName: "Team call.mp4",
          sizeBytes: null,
          uploadedBytes: 0,
          importHost: fileServer.host,
        })
      )
      expect(JSON.stringify(body)).not.toContain("secret")
      expect(await findVideoImportRequests(testApp)).toEqual([
        { videoId: video.id, importId: expect.any(String) },
      ])
    })

    it("records who started the import in the activity log", async () => {
      await setUp()
      const video = await createVideo()

      await startImport(video.id, fileServer.url("/clip.mp4?token=secret"))

      const [activity] = (
        await (
          await ownerClient.get(
            `/organizations/acme/activity?resourceType=video&resourceId=${video.id}`
          )
        ).json()
      ).data.activities as ActivityLogDto[]

      expect(activity).toEqual(
        expect.objectContaining({
          action: "video.import_started",
          after: { importHost: fileServer.host, fileName: "clip.mp4" },
        })
      )
      expect(JSON.stringify(activity)).not.toContain("secret")
    })

    it.each(INVALID_IMPORT_URLS)("refuses the URL %p", async (url) => {
      await setUp()
      const video = await createVideo()

      const response = await startImport(video.id, url)

      expect(response.status).toBe(422)
      expect(await findVideoImportRequests(testApp)).toEqual([])
    })

    it("refuses a video that already has a file", async () => {
      await setUp()
      const video = await createVideo()

      await startImport(video.id, fileServer.url("/clip.mp4"))
      await runImport(video.id)

      const response = await startImport(video.id, fileServer.url("/clip.mp4"))

      expect(response.status).toBe(409)
      expect((await response.json()).code).toBe("video.upload.already_uploaded")
    })

    it("replaces an unfinished upload of the video", async () => {
      await setUp()
      const video = await createVideo()
      const tus = createTusClient(
        memberClient,
        `${libraryPath}/videos/${video.id}`
      )

      await tus.create(clipBytes.byteLength, "clip.mp4")
      expect(testApp.objectStorage.countOpenMultipartUploads()).toBe(1)

      const response = await startImport(video.id, fileServer.url("/clip.mp4"))

      expect(response.status).toBe(202)
      expect(testApp.objectStorage.countOpenMultipartUploads()).toBe(0)
    })

    it("keeps other organizations' members away", async () => {
      await setUp()
      const video = await createVideo()
      const stranger = await createUserFactory(testApp).create()

      await createOrganizationFactory(testApp)
        .ownedBy(stranger)
        .create({ name: "Other", slug: "other" })

      const response = await (
        await signInAsUser(testApp, stranger)
      ).post(`${libraryPath}/videos/${video.id}/import`, {
        url: fileServer.url("/clip.mp4"),
      })

      expect(response.status).toBe(404)
    })
  })

  describe("in production", () => {
    it.each(PRIVATE_IMPORT_URLS)("refuses %s", async (url) => {
      await setUp({}, { VIDEO_IMPORT_ALLOW_PRIVATE_URLS: "false" })
      const video = await createVideo()

      const response = await startImport(video.id, url)

      expect(response.status).toBe(422)
      expect((await response.json()).code).toBe("video.import.url_not_allowed")
    })

    it("does not download from a host that resolves to a private address", async () => {
      await setUp({}, { VIDEO_IMPORT_ALLOW_PRIVATE_URLS: "false" })
      const video = await createVideo()
      const resolveHost = dns.lookup
      const lookup = spyOn(dns, "lookup").mockImplementation(((
        hostname: string,
        options: dns.LookupOptions,
        callback: (...args: unknown[]) => void
      ) =>
        hostname === "files.example.com"
          ? callback(null, [{ address: "169.254.169.254", family: 4 }])
          : resolveHost(hostname, options, callback)) as typeof dns.lookup)

      try {
        await startImport(video.id, "https://files.example.com/clip.mp4")

        const failure = await importFailure(runImport(video.id, false))

        expect(failure).toMatchObject({
          reason: "import_unreachable",
          message: "The host resolves to a private address",
          isPermanent: true,
        })
      } finally {
        lookup.mockRestore()
      }

      expect(await readVideo(video.id)).toEqual(
        expect.objectContaining({
          status: "failed",
          failureReason: "import_unreachable",
        })
      )
    })
  })

  describe("downloading", () => {
    it("stores the file and queues the video for processing, like an upload", async () => {
      await setUp()
      await ownerClient.put(`${libraryPath}/webhook`, {
        url: "https://hooks.example.com/openstream",
      })
      const video = await createVideo()

      await startImport(video.id, fileServer.url("/clip.mp4"))
      await runImport(video.id)

      expect(await readVideo(video.id)).toEqual(
        expect.objectContaining({
          status: "uploaded",
          fileName: "clip.mp4",
          fileFormat: "mp4",
          sizeBytes: clipBytes.byteLength,
          uploadedBytes: clipBytes.byteLength,
          uploadedAt: expect.any(String),
          processingStatus: "pending",
          importHost: null,
        })
      )
      expect(await countVideoImports()).toBe(0)
      expect(await readStoredFile(video.id)).toEqual(clipBytes)
      expect(testApp.objectStorage.countOpenMultipartUploads()).toBe(0)
      expect(await findVideoProcessingRequests(testApp)).toEqual([
        { videoId: video.id, requestId: expect.any(String) },
      ])
      expect(
        (
          await testApp.appModule.db
            .select({ eventType: webhookDeliveries.eventType })
            .from(webhookDeliveries)
        ).map(({ eventType }) => eventType)
      ).toEqual(["video.created", "video.uploaded", "video.processing.queued"])
    })

    it("follows redirects and stores a file of several parts whole", async () => {
      const largeBytes = createFileBytes(
        VIDEO_FILE_HEADERS.MOV,
        VIDEO_UPLOAD_LIMITS.CHUNK_SIZE_BYTES + MIB
      )

      await setUp({
        "/share/clip": () =>
          new Response(null, {
            status: 302,
            headers: { location: "/files/clip.mov" },
          }),
        "/files/clip.mov": () => fileResponse(largeBytes),
      })
      const video = await createVideo()

      await startImport(video.id, fileServer.url("/share/clip"))
      await runImport(video.id)

      expect(await readVideo(video.id)).toEqual(
        expect.objectContaining({
          status: "uploaded",
          fileFormat: "mov",
          sizeBytes: largeBytes.byteLength,
        })
      )
      expect(await readStoredFile(video.id)).toEqual(largeBytes)
      expect(fileServer.requestedPaths).toEqual([
        "/share/clip",
        "/files/clip.mov",
      ])
    })

    it.each(FAILED_IMPORTS)(
      "fails the video when the source is $source",
      async ({ source, isFinalAttempt, failureReason, isPermanent }) => {
        await setUp({
          "/source": () =>
            match(source)
              .with(IMPORT_SOURCES.NOT_A_VIDEO, () =>
                fileResponse(createFileBytes(VIDEO_FILE_HEADERS.TEXT, 1024))
              )
              .with(IMPORT_SOURCES.EMPTY, () => new Response(""))
              .with(
                IMPORT_SOURCES.MISSING,
                () => new Response(null, { status: 404 })
              )
              .with(
                IMPORT_SOURCES.SERVER_ERROR,
                () => new Response(null, { status: 503 })
              )
              .with(
                IMPORT_SOURCES.REDIRECT_LOOP,
                () =>
                  new Response(null, {
                    status: 302,
                    headers: { location: "/source" },
                  })
              )
              .with(
                IMPORT_SOURCES.TOO_LARGE,
                () =>
                  new Response(null, {
                    status: 302,
                    headers: { location: oversizedServer.url("/clip.mp4") },
                  })
              )
              .exhaustive(),
        })
        const video = await createVideo()

        await startImport(video.id, fileServer.url("/source"))

        const failure = await importFailure(runImport(video.id, isFinalAttempt))

        expect(failure).toMatchObject({ reason: failureReason, isPermanent })
        expect(await readVideo(video.id)).toEqual(
          expect.objectContaining({
            status: "failed",
            failureReason,
            uploadedBytes: 0,
          })
        )
        expect(await sourceObjectKey(video.id)).toBeNull()
        expect(await countVideoImports()).toBe(0)
        expect(testApp.objectStorage.countOpenMultipartUploads()).toBe(0)
        expect(await findVideoProcessingRequests(testApp)).toEqual([])
      }
    )

    it("leaves a server error to the next attempt", async () => {
      await setUp({ "/busy": () => new Response(null, { status: 503 }) })
      const video = await createVideo()

      await startImport(video.id, fileServer.url("/busy"))

      const failure = await importFailure(runImport(video.id, false))

      expect(failure).toMatchObject({
        reason: "import_unreachable",
        message: "The server answered 503",
        isPermanent: false,
      })
      expect(await readVideo(video.id)).toEqual(
        expect.objectContaining({ status: "uploading", failureReason: null })
      )
    })

    it.each(["/slow-answer.mp4", "/stalled.mp4"])(
      "times out a download that takes too long: %s",
      async (path) => {
        await setUp(
          {
            "/slow-answer.mp4": async () => {
              await Bun.sleep(2000)

              return fileResponse(clipBytes)
            },
            "/stalled.mp4": () =>
              new Response(
                new ReadableStream({
                  start(controller) {
                    controller.enqueue(clipBytes)
                  },
                })
              ),
          },
          { VIDEO_IMPORT_TIMEOUT_MS: "300" }
        )
        const video = await createVideo()

        await startImport(video.id, fileServer.url(path))

        const failure = await importFailure(runImport(video.id))

        expect(failure).toMatchObject({
          reason: "import_timed_out",
          isPermanent: false,
        })
        expect(await readVideo(video.id)).toEqual(
          expect.objectContaining({
            status: "failed",
            failureReason: "import_timed_out",
          })
        )
      }
    )

    it("retries a download cut short", async () => {
      await setUp()
      const video = await createVideo()

      await startImport(video.id, truncatingServer.url("/clip.mp4"))

      const failure = await importFailure(runImport(video.id, false))

      expect(failure).toMatchObject({
        reason: "import_unreachable",
        isPermanent: false,
      })
      expect(await readVideo(video.id)).toEqual(
        expect.objectContaining({ status: "uploading", uploadedBytes: 0 })
      )
      expect(testApp.objectStorage.countOpenMultipartUploads()).toBe(0)
    })

    it("retries storage failures and fails the video on the last attempt", async () => {
      await setUp()
      const video = await createVideo()

      await startImport(video.id, fileServer.url("/clip.mp4"))
      testApp.objectStorage.failRequests()

      const failure = await importFailure(runImport(video.id))

      testApp.objectStorage.failRequests(false)
      expect(failure).toMatchObject({
        reason: "import_failed",
        isPermanent: false,
      })
      expect(await readVideo(video.id)).toEqual(
        expect.objectContaining({
          status: "failed",
          failureReason: "import_failed",
        })
      )
    })
  })

  describe("replacing", () => {
    it("stops an import replaced before it ran", async () => {
      await setUp()
      const video = await createVideo()

      await startImport(video.id, fileServer.url("/first.mp4"))
      const replaced = await latestImportRequest(video.id)

      await startImport(video.id, fileServer.url("/clip.mp4"))
      await testApp.appModule.videoImportsService.importVideo(replaced, {
        isFinalAttempt: true,
      })

      expect(fileServer.requestedPaths).toEqual([])
      expect((await readVideo(video.id)).status).toBe("uploading")
      expect(await countVideoImports()).toBe(1)

      await runImport(video.id)

      expect((await readVideo(video.id)).status).toBe("uploaded")
    })

    it("stops a running import once an upload replaces it, and discards its parts", async () => {
      let releaseRest = () => {}
      const restReleased = new Promise<void>((resolve) => {
        releaseRest = resolve
      })
      const largeBytes = createFileBytes(
        VIDEO_FILE_HEADERS.MP4,
        VIDEO_UPLOAD_LIMITS.CHUNK_SIZE_BYTES + MIB
      )

      await setUp({
        "/large.mp4": () =>
          new Response(
            new ReadableStream({
              async start(controller) {
                controller.enqueue(
                  largeBytes.subarray(0, VIDEO_UPLOAD_LIMITS.CHUNK_SIZE_BYTES)
                )
                await restReleased
                controller.enqueue(
                  largeBytes.subarray(VIDEO_UPLOAD_LIMITS.CHUNK_SIZE_BYTES)
                )
                controller.close()
              },
            }),
            { headers: { "content-length": String(largeBytes.byteLength) } }
          ),
      })
      const video = await createVideo()

      await startImport(video.id, fileServer.url("/large.mp4"))
      const running = runImport(video.id)

      while (
        (await readVideo(video.id)).uploadedBytes <
        VIDEO_UPLOAD_LIMITS.CHUNK_SIZE_BYTES
      ) {
        await Bun.sleep(10)
      }

      await createTusClient(
        memberClient,
        `${libraryPath}/videos/${video.id}`
      ).create(clipBytes.byteLength, "clip.mp4")
      releaseRest()
      await running

      expect(await readVideo(video.id)).toEqual(
        expect.objectContaining({
          status: "uploading",
          fileName: "clip.mp4",
          sizeBytes: clipBytes.byteLength,
          importHost: null,
        })
      )
      expect(await countVideoImports()).toBe(0)
      expect(testApp.objectStorage.countOpenMultipartUploads()).toBe(1)
      expect(await findVideoProcessingRequests(testApp)).toEqual([])
    })
  })

  describe("library API", () => {
    const createApiKey = async (scopes: string[]) =>
      (
        await (
          await ownerClient.post(`${libraryPath}/api-keys`, {
            name: "Server",
            scopes,
          })
        ).json()
      ).data.secret as string

    it("imports with a key holding videos:upload", async () => {
      await setUp()
      const apiClient = createLibraryApiClient(
        testApp,
        await createApiKey(["videos:upload"])
      )
      const { video } = (
        await (
          await apiClient.post(`/libraries/${library.id}/videos`, {
            title: "Clip",
          })
        ).json()
      ).data

      const response = await apiClient.post(
        `/libraries/${library.id}/videos/${video.id}/import`,
        { url: fileServer.url("/clip.mp4") }
      )

      expect(response.status).toBe(202)
      await runImport(video.id)
      expect((await readVideo(video.id)).status).toBe("uploaded")
    })

    it("refuses a key without videos:upload", async () => {
      await setUp()
      const video = await createVideo()
      const apiClient = createLibraryApiClient(
        testApp,
        await createApiKey(["videos:read"])
      )

      const response = await apiClient.post(
        `/libraries/${library.id}/videos/${video.id}/import`,
        { url: fileServer.url("/clip.mp4") }
      )

      expect(response.status).toBe(403)
      expect(await findVideoImportRequests(testApp)).toEqual([])
    })
  })
})
