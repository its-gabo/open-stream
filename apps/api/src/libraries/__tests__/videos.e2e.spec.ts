import { afterEach, beforeEach, describe, expect, it } from "bun:test"

import { createLibraryFactory } from "../../../test/factory/library.factory"
import { createOrganizationFactory } from "../../../test/factory/organization.factory"
import { createStorageFactory } from "../../../test/factory/storage.factory"
import { createUserFactory } from "../../../test/factory/user.factory"
import { signInAsUser } from "../../../test/helpers/api-client"
import {
  findVideoProcessingRequests,
  latestDeletionTokens,
  runStorageCleanups,
} from "../../../test/helpers/outbox"
import { createTusClient, requireLocation } from "../../../test/helpers/tus"
import {
  VIDEO_FILE_HEADERS,
  createFileBytes,
} from "../../../test/helpers/video-files"
import { createTestApp } from "../../../test/helpers/test-app"
import {
  DISGUISED_FILES,
  FAILED_UPLOAD_COMPLETIONS,
  REJECTED_UPLOAD_STARTS,
  REJECTED_VIDEO_BODIES,
  TEST_CHUNK_SIZE,
  UPLOADED_FILES,
} from "./video-uploads.scenarios"

import type { UserCredentials } from "../../../test/factory/user.factory"
import type { ApiClient } from "../../../test/helpers/api-client"
import type { TestApp } from "../../../test/helpers/test-app"
import { storageCleanups } from "../../db/schema"
import { VALID_DELETION_CONFIRMATION } from "../../organizations/__tests__/organization-deletion.scenarios"

import type { LibraryDto, VideoDto } from "../dto/libraries.schemas"

describe("Videos (e2e)", () => {
  let testApp: TestApp
  let owner: UserCredentials
  let member: UserCredentials
  let memberClient: ApiClient
  let organizationId: string
  let library: LibraryDto
  let libraryPath: string

  beforeEach(async () => {
    testApp = await createTestApp()
    owner = await createUserFactory(testApp).create()
    member = await createUserFactory(testApp).create()
    await createOrganizationFactory(testApp)
      .ownedBy(owner)
      .withMembers(member)
      .create({ name: "Acme", slug: "acme" })
    library = await createLibraryFactory(testApp)
      .inOrganization("acme", owner)
      .create({ name: "Marketing" })
    libraryPath = `/organizations/acme/libraries/${library.id}`
    memberClient = await signInAsUser(testApp, member)
    organizationId = (
      await (await memberClient.get("/organizations/acme")).json()
    ).data.organization.id
  })

  afterEach(() => testApp.close())

  const createVideo = async (
    body: { title?: string; fileName?: string },
    client = memberClient
  ): Promise<VideoDto> =>
    (await (await client.post(`${libraryPath}/videos`, body)).json()).data.video

  const readVideo = async (videoId: string): Promise<VideoDto> =>
    (await (await memberClient.get(`${libraryPath}/videos/${videoId}`)).json())
      .data.video

  const tusFor = (videoId: string, client = memberClient) =>
    createTusClient(client, `${libraryPath}/videos/${videoId}`)

  const defaultStorage = () => testApp.appModule.defaultStorageLocation

  describe("creating", () => {
    it("creates a draft shell with the given title", async () => {
      const response = await memberClient.post(`${libraryPath}/videos`, {
        title: "  Quarterly review ",
      })

      expect(response.status).toBe(201)
      expect((await response.json()).data.video).toEqual({
        id: expect.any(String),
        libraryId: library.id,
        title: "Quarterly review",
        status: "draft",
        failureReason: null,
        fileName: null,
        fileFormat: null,
        sizeBytes: null,
        uploadedBytes: 0,
        importHost: null,
        createdAt: expect.any(String),
        uploadedAt: null,
        processingStatus: null,
        processingFailureReason: null,
        durationSeconds: null,
        width: null,
        height: null,
        renditions: [],
        processedAt: null,
        poster: { source: "automatic", frameSeconds: null, updatedAt: null },
        chapters: [],
      })
    })

    it("names the video after its file when no title is given", async () => {
      expect(await createVideo({ fileName: "Team call.final.mov" })).toEqual(
        expect.objectContaining({ title: "Team call.final" })
      )
    })

    it("prefers the title over the file name", async () => {
      expect(
        await createVideo({ title: "Kickoff", fileName: "IMG_0042.mov" })
      ).toEqual(expect.objectContaining({ title: "Kickoff" }))
    })

    it.each(REJECTED_VIDEO_BODIES)("rejects $description", async ({ body }) => {
      const response = await memberClient.post(`${libraryPath}/videos`, body)

      expect(response.status).toBe(422)
    })

    it("lists videos newest first", async () => {
      await createVideo({ title: "First" })
      await createVideo({ title: "Second" })

      const { videos } = (
        await (await memberClient.get(`${libraryPath}/videos`)).json()
      ).data

      expect(videos.map((video: VideoDto) => video.title)).toEqual([
        "Second",
        "First",
      ])
    })

    it("renames a video", async () => {
      const video = await createVideo({ title: "Draft" })

      const response = await memberClient.patch(
        `${libraryPath}/videos/${video.id}`,
        { title: "Final cut" }
      )

      expect(response.status).toBe(200)
      expect((await readVideo(video.id)).title).toBe("Final cut")
    })
  })

  describe("uploading", () => {
    it.each(UPLOADED_FILES)(
      "stores $description under the organization, library and video",
      async ({ fileName, header, size, fileFormat }) => {
        const video = await createVideo({ fileName })
        const bytes = createFileBytes(header, size)

        const response = await tusFor(video.id).upload(
          bytes,
          fileName,
          TEST_CHUNK_SIZE
        )

        const objectKey = `${organizationId}/${library.id}/${video.id}/source`

        expect(response.status).toBe(204)
        expect(response.headers.get("upload-offset")).toBe(String(size))
        expect(await readVideo(video.id)).toEqual(
          expect.objectContaining({
            status: "uploaded",
            fileName,
            fileFormat,
            sizeBytes: size,
            uploadedBytes: size,
            uploadedAt: expect.any(String),
          })
        )
        expect(testApp.objectStorage.listObjectKeys(defaultStorage())).toEqual([
          objectKey,
        ])
        expect(
          testApp.objectStorage.readObject(defaultStorage(), objectKey)
        ).toEqual(bytes)
      }
    )

    it("reports the upload state while chunks arrive", async () => {
      const video = await createVideo({ title: "Demo" })
      const bytes = createFileBytes(VIDEO_FILE_HEADERS.MP4, 2 * TEST_CHUNK_SIZE)
      const tus = tusFor(video.id)
      const location = requireLocation(
        await tus.create(bytes.byteLength, "demo.mp4")
      )

      expect(await readVideo(video.id)).toEqual(
        expect.objectContaining({
          status: "uploading",
          sizeBytes: bytes.byteLength,
          uploadedBytes: 0,
        })
      )

      await tus.patch(location, 0, bytes.subarray(0, TEST_CHUNK_SIZE))

      const head = await tus.head(location)

      expect(head.status).toBe(200)
      expect(head.headers.get("upload-offset")).toBe(String(TEST_CHUNK_SIZE))
      expect(head.headers.get("upload-length")).toBe(String(bytes.byteLength))
      expect(head.headers.get("tus-resumable")).toBe("1.0.0")
      expect(await readVideo(video.id)).toEqual(
        expect.objectContaining({
          status: "uploading",
          fileFormat: "mp4",
          uploadedBytes: TEST_CHUNK_SIZE,
        })
      )
    })

    it("resumes from the stored offset after an interruption", async () => {
      const video = await createVideo({ title: "Demo" })
      const bytes = createFileBytes(
        VIDEO_FILE_HEADERS.MP4,
        TEST_CHUNK_SIZE + 10
      )
      const tus = tusFor(video.id)
      const location = requireLocation(
        await tus.create(bytes.byteLength, "demo.mp4")
      )

      await tus.patch(location, 0, bytes.subarray(0, TEST_CHUNK_SIZE))

      const stale = await tus.patch(
        location,
        0,
        bytes.subarray(0, TEST_CHUNK_SIZE)
      )
      const offset = Number(
        (await tus.head(location)).headers.get("upload-offset")
      )
      const resumed = await tus.patch(location, offset, bytes.subarray(offset))

      expect(stale.status).toBe(409)
      expect(resumed.status).toBe(204)
      expect((await readVideo(video.id)).status).toBe("uploaded")
    })

    it("keeps the bytes of the winning request when two send the same chunk at once", async () => {
      const video = await createVideo({ title: "Demo" })
      const bytes = createFileBytes(VIDEO_FILE_HEADERS.MP4, 2 * TEST_CHUNK_SIZE)
      const firstChunk = bytes.slice(0, TEST_CHUNK_SIZE)
      const otherFirstChunk = firstChunk.slice()
      otherFirstChunk[TEST_CHUNK_SIZE - 1] =
        firstChunk[TEST_CHUNK_SIZE - 1]! ^ 0xff
      const tus = tusFor(video.id)
      const location = requireLocation(
        await tus.create(bytes.byteLength, "demo.mp4")
      )

      const responses = await Promise.all([
        tus.patch(location, 0, firstChunk),
        tus.patch(location, 0, otherFirstChunk),
      ])
      const winningChunk =
        responses[0]!.status === 204 ? firstChunk : otherFirstChunk
      const finished = await tus.patch(
        location,
        TEST_CHUNK_SIZE,
        bytes.slice(TEST_CHUNK_SIZE)
      )
      const stored = testApp.objectStorage.readObject(
        defaultStorage(),
        `${organizationId}/${library.id}/${video.id}/source`
      )!

      expect(responses.map(({ status }) => status).sort()).toEqual([204, 409])
      expect(finished.status).toBe(204)
      expect(stored.subarray(0, TEST_CHUNK_SIZE)).toEqual(winningChunk)
      expect(stored.subarray(TEST_CHUNK_SIZE)).toEqual(
        bytes.subarray(TEST_CHUNK_SIZE)
      )
    })

    it.each(DISGUISED_FILES)(
      "rejects $description by its bytes and marks the video failed",
      async ({ fileName, header }) => {
        const video = await createVideo({ fileName })

        const response = await tusFor(video.id).upload(
          createFileBytes(header, 4096),
          fileName,
          TEST_CHUNK_SIZE
        )

        expect(response.status).toBe(415)
        expect((await response.json()).code).toBe(
          "video.upload.unsupported_file_type"
        )
        expect(await readVideo(video.id)).toEqual(
          expect.objectContaining({
            status: "failed",
            failureReason: "invalid_file_type",
          })
        )
        expect(testApp.objectStorage.listObjectKeys(defaultStorage())).toEqual(
          []
        )
        expect(testApp.objectStorage.countOpenMultipartUploads()).toBe(0)
      }
    )

    it("accepts a new file after a rejected one", async () => {
      const video = await createVideo({ title: "Retry" })

      await tusFor(video.id).upload(
        createFileBytes(VIDEO_FILE_HEADERS.PNG, 4096),
        "photo.mp4",
        TEST_CHUNK_SIZE
      )
      const response = await tusFor(video.id).upload(
        createFileBytes(VIDEO_FILE_HEADERS.MP4, 4096),
        "clip.mp4",
        TEST_CHUNK_SIZE
      )

      expect(response.status).toBe(204)
      expect(await readVideo(video.id)).toEqual(
        expect.objectContaining({ status: "uploaded", failureReason: null })
      )
    })

    it.each(REJECTED_UPLOAD_STARTS)(
      "refuses to start $description",
      async ({ fileName, uploadLength, status, code }) => {
        const video = await createVideo({ title: "Clip" })

        const response = await tusFor(video.id).create(uploadLength, fileName)

        expect(response.status).toBe(status)
        expect((await response.json()).code).toBe(code)
        expect((await readVideo(video.id)).status).toBe("draft")
      }
    )

    it("refuses a second file for an uploaded video", async () => {
      const video = await createVideo({ title: "Done" })

      await tusFor(video.id).upload(
        createFileBytes(VIDEO_FILE_HEADERS.MP4, 1024),
        "done.mp4",
        TEST_CHUNK_SIZE
      )
      const response = await tusFor(video.id).create(1024, "again.mp4")

      expect(response.status).toBe(409)
    })

    it("rejects a chunk below the minimum part size unless it is the last", async () => {
      const video = await createVideo({ title: "Demo" })
      const tus = tusFor(video.id)
      const location = requireLocation(
        await tus.create(2 * TEST_CHUNK_SIZE, "demo.mp4")
      )

      const response = await tus.patch(
        location,
        0,
        createFileBytes(VIDEO_FILE_HEADERS.MP4, 1024)
      )

      expect(response.status).toBe(422)
    })

    it("rejects bytes beyond the declared length", async () => {
      const video = await createVideo({ title: "Demo" })
      const tus = tusFor(video.id)
      const location = requireLocation(await tus.create(100, "demo.mp4"))

      const response = await tus.patch(
        location,
        0,
        createFileBytes(VIDEO_FILE_HEADERS.MP4, 200)
      )

      expect(response.status).toBe(422)
    })

    it("requires the tus protocol version", async () => {
      const video = await createVideo({ title: "Demo" })

      const response = await tusFor(video.id).create(1024, "demo.mp4", {
        "tus-resumable": "0.2.2",
      })

      expect(response.status).toBe(412)
      expect(response.headers.get("tus-version")).toBe("1.0.0")
    })

    it("cancels an upload and returns the video to a draft", async () => {
      const video = await createVideo({ title: "Demo" })
      const tus = tusFor(video.id)
      const location = requireLocation(
        await tus.create(2 * TEST_CHUNK_SIZE, "demo.mp4")
      )

      const response = await tus.terminate(location)

      expect(response.status).toBe(204)
      expect(await readVideo(video.id)).toEqual(
        expect.objectContaining({
          status: "draft",
          fileName: null,
          sizeBytes: null,
        })
      )
      expect((await tus.head(location)).status).toBe(404)
      expect(testApp.objectStorage.countOpenMultipartUploads()).toBe(0)
    })

    it("replaces an unfinished upload when a new one starts", async () => {
      const video = await createVideo({ title: "Demo" })
      const tus = tusFor(video.id)
      const firstLocation = requireLocation(
        await tus.create(2 * TEST_CHUNK_SIZE, "demo.mp4")
      )

      requireLocation(await tus.create(1024, "demo.mp4"))

      expect((await tus.head(firstLocation)).status).toBe(404)
      expect(testApp.objectStorage.countOpenMultipartUploads()).toBe(1)
    })

    it("ignores a late cancel of an upload another one replaced", async () => {
      const video = await createVideo({ title: "Demo" })
      const bytes = createFileBytes(VIDEO_FILE_HEADERS.MP4, 1024)
      const tus = tusFor(video.id)
      const replacedLocation = requireLocation(
        await tus.create(2 * TEST_CHUNK_SIZE, "old.mp4")
      )
      const location = requireLocation(
        await tus.create(bytes.byteLength, "demo.mp4")
      )

      const canceled = await tus.terminate(replacedLocation)
      const finished = await tus.patch(location, 0, bytes)

      expect(canceled.status).toBe(404)
      expect(finished.status).toBe(204)
      expect(await readVideo(video.id)).toEqual(
        expect.objectContaining({ status: "uploaded", fileName: "demo.mp4" })
      )
      expect(testApp.objectStorage.countOpenMultipartUploads()).toBe(0)
    })

    it("lets either the last chunk or a cancel sent with it win, never both", async () => {
      const video = await createVideo({ title: "Demo" })
      const bytes = createFileBytes(VIDEO_FILE_HEADERS.MP4, 1024)
      const tus = tusFor(video.id)
      const location = requireLocation(
        await tus.create(bytes.byteLength, "demo.mp4")
      )

      const [finished, canceled] = await Promise.all([
        tus.patch(location, 0, bytes),
        tus.terminate(location),
      ])
      const stored = testApp.objectStorage.readObject(
        defaultStorage(),
        `${organizationId}/${library.id}/${video.id}/source`
      )
      const processingRequests = await findVideoProcessingRequests(testApp)

      if (finished.status === 204) {
        expect(canceled.status).toBe(404)
        expect((await readVideo(video.id)).status).toBe("uploaded")
        expect(stored).toEqual(bytes)
        expect(processingRequests).toHaveLength(1)
      } else {
        expect(canceled.status).toBe(204)
        expect((await readVideo(video.id)).status).toBe("draft")
        expect(stored).toBeNull()
        expect(processingRequests).toEqual([])
      }
      expect(testApp.objectStorage.countOpenMultipartUploads()).toBe(0)
    })

    it.each(FAILED_UPLOAD_COMPLETIONS)(
      "keeps the last chunk retryable when $description",
      async ({ failOnce, status }) => {
        const video = await createVideo({ title: "Demo" })
        const bytes = createFileBytes(VIDEO_FILE_HEADERS.MP4, 1024)
        const tus = tusFor(video.id)
        const location = requireLocation(
          await tus.create(bytes.byteLength, "demo.mp4")
        )
        failOnce(testApp)

        const failed = await tus.patch(location, 0, bytes)
        const offset = (await tus.head(location)).headers.get("upload-offset")
        const retried = await tus.patch(location, 0, bytes)

        expect(failed.status).toBe(status)
        expect(offset).toBe("0")
        expect(retried.status).toBe(204)
        expect((await readVideo(video.id)).status).toBe("uploaded")
        expect(await findVideoProcessingRequests(testApp)).toHaveLength(1)
      }
    )

    it("reports an unavailable storage without losing the video", async () => {
      const video = await createVideo({ title: "Demo" })

      testApp.objectStorage.failRequests()

      const response = await tusFor(video.id).create(1024, "demo.mp4")

      expect(response.status).toBe(503)
      expect((await readVideo(video.id)).status).toBe("draft")
    })
  })

  describe("deleting", () => {
    it("deletes the video at once and its stored file in the worker", async () => {
      const video = await createVideo({ title: "Old" })

      await tusFor(video.id).upload(
        createFileBytes(VIDEO_FILE_HEADERS.MP4, 1024),
        "old.mp4",
        TEST_CHUNK_SIZE
      )
      const response = await memberClient.delete(
        `${libraryPath}/videos/${video.id}`
      )
      const keysBeforeCleanup =
        testApp.objectStorage.listObjectKeys(defaultStorage())
      const errors = await runStorageCleanups(testApp)

      expect(response.status).toBe(200)
      expect(
        (await memberClient.get(`${libraryPath}/videos/${video.id}`)).status
      ).toBe(404)
      expect(keysBeforeCleanup).toHaveLength(1)
      expect(errors).toEqual([])
      expect(testApp.objectStorage.listObjectKeys(defaultStorage())).toEqual([])
      expect(await testApp.appModule.db.select().from(storageCleanups)).toEqual(
        []
      )
    })

    it("aborts the unfinished upload of a deleted video", async () => {
      const video = await createVideo({ title: "Partial" })

      await tusFor(video.id).create(2 * TEST_CHUNK_SIZE, "partial.mp4")
      await memberClient.delete(`${libraryPath}/videos/${video.id}`)
      await runStorageCleanups(testApp)

      expect(testApp.objectStorage.countOpenMultipartUploads()).toBe(0)
    })

    it("deletes the video while storage is down and removes its file once it is back", async () => {
      const video = await createVideo({ title: "Later" })

      await tusFor(video.id).upload(
        createFileBytes(VIDEO_FILE_HEADERS.MP4, 1024),
        "later.mp4",
        TEST_CHUNK_SIZE
      )
      testApp.objectStorage.failRequests()

      const response = await memberClient.delete(
        `${libraryPath}/videos/${video.id}`
      )
      const failedAttempts = await runStorageCleanups(testApp)
      const [pendingCleanup] = await testApp.appModule.db
        .select()
        .from(storageCleanups)
      testApp.objectStorage.failRequests(false)
      const retriedAttempts = await runStorageCleanups(testApp)

      expect(response.status).toBe(200)
      expect(failedAttempts).toHaveLength(1)
      expect(pendingCleanup).toEqual(
        expect.objectContaining({ attempts: 1, lastError: expect.any(String) })
      )
      expect(retriedAttempts).toEqual([])
      expect(testApp.objectStorage.listObjectKeys(defaultStorage())).toEqual([])
    })

    it("removes the files of a library's own storage after the organization is deleted", async () => {
      const ownerClient = await signInAsUser(testApp, owner)
      const storage = await createStorageFactory(testApp)
        .inOrganization("acme", owner)
        .create()
      await ownerClient.put(`${libraryPath}/storage`, { storageId: storage.id })
      const video = await createVideo({ title: "Custom" })
      await tusFor(video.id).upload(
        createFileBytes(VIDEO_FILE_HEADERS.MP4, 1024),
        "custom.mp4",
        TEST_CHUNK_SIZE
      )
      const location = {
        ...defaultStorage(),
        endpoint: storage.endpoint,
        region: storage.region,
        bucket: storage.bucket,
      }
      const keysBefore = testApp.objectStorage.listObjectKeys(location)

      await ownerClient.post(
        "/organizations/acme/deletion",
        VALID_DELETION_CONFIRMATION
      )
      const { deleteToken } = await latestDeletionTokens(testApp, owner.email)
      const deleted = await ownerClient.post(
        "/organization-deletion-actions/delete",
        { token: deleteToken }
      )
      await runStorageCleanups(testApp)

      expect(deleted.status).toBe(200)
      expect(keysBefore).toHaveLength(1)
      expect(testApp.objectStorage.listObjectKeys(location)).toEqual([])
    })
  })

  describe("organization isolation", () => {
    let outsiderClient: ApiClient
    let otherLibrary: LibraryDto

    beforeEach(async () => {
      const outsider = await createUserFactory(testApp).create()

      await createOrganizationFactory(testApp)
        .ownedBy(outsider)
        .create({ name: "Globex", slug: "globex" })
      otherLibrary = await createLibraryFactory(testApp)
        .inOrganization("globex", outsider)
        .create({ name: "Globex videos" })
      outsiderClient = await signInAsUser(testApp, outsider)
    })

    it("hides another organization's videos and uploads", async () => {
      const video = await createVideo({ title: "Internal" })
      const location = requireLocation(
        await tusFor(video.id).create(2 * TEST_CHUNK_SIZE, "internal.mp4")
      )
      const outsiderTus = tusFor(video.id, outsiderClient)

      const responses = await Promise.all([
        outsiderClient.get(`${libraryPath}/videos`),
        outsiderClient.get(`${libraryPath}/videos/${video.id}`),
        outsiderClient.delete(`${libraryPath}/videos/${video.id}`),
        outsiderTus.create(1024, "takeover.mp4"),
        outsiderTus.head(location),
        outsiderTus.patch(
          location,
          0,
          createFileBytes(VIDEO_FILE_HEADERS.MP4, TEST_CHUNK_SIZE)
        ),
        outsiderTus.terminate(location),
      ])

      expect(responses.map((response) => response.status)).toEqual(
        Array(responses.length).fill(404)
      )
      expect((await readVideo(video.id)).uploadedBytes).toBe(0)
    })

    it("does not reach a video through a library of another organization", async () => {
      const video = await createVideo({ title: "Internal" })
      const crossPath = `/organizations/globex/libraries/${otherLibrary.id}/videos/${video.id}`

      const responses = await Promise.all([
        outsiderClient.get(crossPath),
        createTusClient(outsiderClient, crossPath).create(1024, "x.mp4"),
      ])

      expect(responses.map((response) => response.status)).toEqual([404, 404])
    })

    it("does not reach a library through another organization's address", async () => {
      const response = await memberClient.get(
        `/organizations/acme/libraries/${otherLibrary.id}/videos`
      )

      expect(response.status).toBe(404)
    })
  })
})
