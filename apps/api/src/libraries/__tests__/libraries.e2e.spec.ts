import { afterEach, beforeEach, describe, expect, it } from "bun:test"

import { createLibraryFactory } from "../../../test/factory/library.factory"
import { createOrganizationFactory } from "../../../test/factory/organization.factory"
import { createStorageFactory } from "../../../test/factory/storage.factory"
import { createUserFactory } from "../../../test/factory/user.factory"
import { createApiClient, signInAsUser } from "../../../test/helpers/api-client"
import { createTusClient } from "../../../test/helpers/tus"
import {
  VIDEO_FILE_HEADERS,
  createFileBytes,
} from "../../../test/helpers/video-files"
import { createTestApp } from "../../../test/helpers/test-app"

import type { UserCredentials } from "../../../test/factory/user.factory"
import type { ApiClient } from "../../../test/helpers/api-client"
import type { TestApp } from "../../../test/helpers/test-app"
import type { StorageDto } from "../../storage/dto/storages.schemas"
import type { LibraryDto } from "../dto/libraries.schemas"

describe("Libraries (e2e)", () => {
  let testApp: TestApp
  let owner: UserCredentials
  let ownerClient: ApiClient
  let memberClient: ApiClient

  beforeEach(async () => {
    testApp = await createTestApp()
    owner = await createUserFactory(testApp).create()
    const member = await createUserFactory(testApp).create()

    await createOrganizationFactory(testApp)
      .ownedBy(owner)
      .withMembers(member)
      .create({ name: "Acme", slug: "acme" })
    ownerClient = await signInAsUser(testApp, owner)
    memberClient = await signInAsUser(testApp, member)
  })

  afterEach(() => testApp.close())

  const createLibrary = (name: string) =>
    createLibraryFactory(testApp).inOrganization("acme", owner).create({ name })

  it("requires a session", async () => {
    const response = await createApiClient(testApp).get(
      "/organizations/acme/libraries"
    )

    expect(response.status).toBe(401)
  })

  describe("managing libraries", () => {
    it("lets the owner create a library on the default storage", async () => {
      const response = await ownerClient.post("/organizations/acme/libraries", {
        name: "  Marketing ",
      })

      expect(response.status).toBe(201)
      expect((await response.json()).data.library).toEqual({
        id: expect.any(String),
        name: "Marketing",
        storageKind: "default",
        storageName: null,
        videoCount: 0,
        isStorageLocked: false,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      })
    })

    it("forbids members from creating libraries", async () => {
      const response = await memberClient.post(
        "/organizations/acme/libraries",
        { name: "Mine" }
      )

      expect(response.status).toBe(403)
    })

    it("lists libraries with their video counts to members", async () => {
      const library = await createLibrary("Marketing")

      await createLibrary("Sales")
      await memberClient.post(
        `/organizations/acme/libraries/${library.id}/videos`,
        { title: "Launch" }
      )

      const { libraries } = (
        await (await memberClient.get("/organizations/acme/libraries")).json()
      ).data

      expect(
        libraries.map(({ name, videoCount }: LibraryDto) => ({
          name,
          videoCount,
        }))
      ).toEqual([
        { name: "Marketing", videoCount: 1 },
        { name: "Sales", videoCount: 0 },
      ])
    })

    it("pages through libraries ordered by name", async () => {
      await createLibrary("Sales")
      await createLibrary("Brand")
      await createLibrary("Marketing")

      const { libraries, pagination } = (
        await (
          await memberClient.get(
            "/organizations/acme/libraries?page=2&pageSize=2"
          )
        ).json()
      ).data

      expect(libraries.map(({ name }: LibraryDto) => name)).toEqual(["Sales"])
      expect(pagination).toEqual({
        page: 2,
        pageSize: 2,
        totalItems: 3,
        totalPages: 2,
      })
    })

    it("searches libraries by name case-insensitively", async () => {
      await createLibrary("Marketing EU")
      await createLibrary("Marketing US")
      await createLibrary("Sales")

      const { libraries, pagination } = (
        await (
          await memberClient.get("/organizations/acme/libraries?search=MARKET")
        ).json()
      ).data

      expect(libraries.map(({ name }: LibraryDto) => name)).toEqual([
        "Marketing EU",
        "Marketing US",
      ])
      expect(pagination.totalItems).toBe(2)
    })

    it("treats a blank search as no search", async () => {
      await createLibrary("Marketing")

      const { pagination } = (
        await (
          await memberClient.get("/organizations/acme/libraries?search=%20%20")
        ).json()
      ).data

      expect(pagination).toEqual({
        page: 1,
        pageSize: 20,
        totalItems: 1,
        totalPages: 1,
      })
    })

    it.each(["page=0", "pageSize=0", "pageSize=101", "page=abc"])(
      "rejects the query %s",
      async (query) => {
        const response = await memberClient.get(
          `/organizations/acme/libraries?${query}`
        )

        expect(response.status).toBe(422)
      }
    )

    it("lets the owner rename a library", async () => {
      const library = await createLibrary("Marketing")

      const response = await ownerClient.patch(
        `/organizations/acme/libraries/${library.id}`,
        { name: "Brand" }
      )

      expect(response.status).toBe(200)
      expect((await response.json()).data.library.name).toBe("Brand")
    })

    it("hides libraries of other organizations", async () => {
      const outsider = await createUserFactory(testApp).create()

      await createOrganizationFactory(testApp)
        .ownedBy(outsider)
        .create({ name: "Globex", slug: "globex" })
      const library = await createLibrary("Marketing")
      const outsiderClient = await signInAsUser(testApp, outsider)

      const responses = await Promise.all([
        outsiderClient.get(`/organizations/acme/libraries/${library.id}`),
        outsiderClient.get(`/organizations/globex/libraries/${library.id}`),
        outsiderClient.patch(`/organizations/globex/libraries/${library.id}`, {
          name: "Taken",
        }),
      ])

      expect(responses.map((response) => response.status)).toEqual([
        404, 404, 404,
      ])
    })
  })

  describe("library storage", () => {
    let library: LibraryDto
    let storage: StorageDto
    let storagePath: string

    beforeEach(async () => {
      library = await createLibrary("Marketing")
      storage = await createStorageFactory(testApp)
        .inOrganization("acme", owner)
        .create({ name: "Archive", pathTemplate: "videos/{videoId}" })
      storagePath = `/organizations/acme/libraries/${library.id}/storage`
    })

    const uploadVideo = async (libraryId = library.id) => {
      const videosPath = `/organizations/acme/libraries/${libraryId}/videos`
      const { video } = (
        await (await memberClient.post(videosPath, { title: "Clip" })).json()
      ).data

      await createTusClient(memberClient, `${videosPath}/${video.id}`).upload(
        createFileBytes(VIDEO_FILE_HEADERS.MP4, 1024),
        "clip.mp4",
        1024
      )

      return video.id as string
    }

    const storageLocationOf = (dto: StorageDto) => ({
      endpoint: dto.endpoint,
      bucket: dto.bucket,
    })

    it("uses the default storage until the owner assigns one", async () => {
      const response = await ownerClient.get(storagePath)

      expect(response.status).toBe(200)
      expect((await response.json()).data.storage).toEqual({
        kind: "default",
        defaultPathTemplate: "{organizationId}/{libraryId}/{videoId}",
        custom: null,
        isLocked: false,
      })
    })

    it("assigns one of the organization's storages", async () => {
      const response = await ownerClient.put(storagePath, {
        storageId: storage.id,
      })
      const { library: updated } = (
        await (
          await memberClient.get(`/organizations/acme/libraries/${library.id}`)
        ).json()
      ).data

      expect(response.status).toBe(200)
      expect((await response.json()).data.storage).toEqual({
        kind: "custom",
        defaultPathTemplate: expect.any(String),
        custom: expect.objectContaining({
          id: storage.id,
          name: "Archive",
          libraryCount: 1,
        }),
        isLocked: false,
      })
      expect(updated).toEqual(
        expect.objectContaining({
          storageKind: "custom",
          storageName: "Archive",
        })
      )
    })

    it("lets several libraries share one storage", async () => {
      const otherLibrary = await createLibrary("Sales")

      await ownerClient.put(storagePath, { storageId: storage.id })
      await ownerClient.put(
        `/organizations/acme/libraries/${otherLibrary.id}/storage`,
        { storageId: storage.id }
      )
      const [firstVideoId, secondVideoId] = [
        await uploadVideo(),
        await uploadVideo(otherLibrary.id),
      ]

      expect(
        testApp.objectStorage.listObjectKeys(storageLocationOf(storage))
      ).toEqual(
        [
          `videos/${firstVideoId}/source`,
          `videos/${secondVideoId}/source`,
        ].sort()
      )
      expect(
        testApp.objectStorage.listObjectKeys(
          testApp.appModule.defaultStorageLocation
        )
      ).toEqual([])
    })

    it("rejects storages of other organizations", async () => {
      const outsider = await createUserFactory(testApp).create()

      await createOrganizationFactory(testApp)
        .ownedBy(outsider)
        .create({ name: "Globex", slug: "globex" })
      const foreignStorage = await createStorageFactory(testApp)
        .inOrganization("globex", outsider)
        .create()

      const response = await ownerClient.put(storagePath, {
        storageId: foreignStorage.id,
      })

      expect(response.status).toBe(404)
      expect((await response.json()).code).toBe("storage.not_found")
    })

    it("locks the storage once a video file was stored", async () => {
      await uploadVideo()

      const responses = await Promise.all([
        ownerClient.put(storagePath, { storageId: storage.id }),
        ownerClient.put(storagePath, { storageId: null }),
      ])

      expect(responses.map((response) => response.status)).toEqual([409, 409])
      expect(
        (await (await ownerClient.get(storagePath)).json()).data.storage
      ).toEqual(expect.objectContaining({ kind: "default", isLocked: true }))
      expect(
        (
          await (
            await ownerClient.get(`/organizations/acme/libraries/${library.id}`)
          ).json()
        ).data.library.isStorageLocked
      ).toBe(true)
    })

    it("goes back to the default storage", async () => {
      await ownerClient.put(storagePath, { storageId: storage.id })

      const response = await ownerClient.put(storagePath, { storageId: null })

      expect(response.status).toBe(200)
      expect((await response.json()).data.storage).toEqual(
        expect.objectContaining({ kind: "default", custom: null })
      )
    })

    it("keeps the storage settings away from members", async () => {
      const responses = await Promise.all([
        memberClient.get(storagePath),
        memberClient.put(storagePath, { storageId: storage.id }),
      ])

      expect(responses.map((response) => response.status)).toEqual([403, 403])
    })
  })
})
