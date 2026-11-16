import { eq } from "drizzle-orm"
import { afterEach, beforeEach, describe, expect, it } from "bun:test"

import { createLibraryFactory } from "../../../test/factory/library.factory"
import { createOrganizationFactory } from "../../../test/factory/organization.factory"
import { createStorageFactory } from "../../../test/factory/storage.factory"
import { createUserFactory } from "../../../test/factory/user.factory"
import { signInAsUser } from "../../../test/helpers/api-client"
import { createTestApp } from "../../../test/helpers/test-app"
import { createTusClient } from "../../../test/helpers/tus"
import {
  VIDEO_FILE_HEADERS,
  createFileBytes,
} from "../../../test/helpers/video-files"
import { storages } from "../../db/schema"
import {
  CUSTOM_STORAGE,
  REJECTED_PATH_TEMPLATES,
  REJECTED_STORAGE_BODIES,
} from "./storages.scenarios"

import type { UserCredentials } from "../../../test/factory/user.factory"
import type { ApiClient } from "../../../test/helpers/api-client"
import type { TestApp } from "../../../test/helpers/test-app"
import type { StorageDto } from "../dto/storages.schemas"

const STORAGES_PATH = "/organizations/acme/storages"

const {
  name: _name,
  pathTemplate: _pathTemplate,
  ...CUSTOM_CONNECTION
} = CUSTOM_STORAGE

describe("Storages (e2e)", () => {
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
    testApp.objectStorage.addBucket({
      endpoint: CUSTOM_STORAGE.endpoint,
      region: CUSTOM_STORAGE.region,
      bucket: CUSTOM_STORAGE.bucket,
      forcePathStyle: CUSTOM_STORAGE.forcePathStyle,
      credentials: {
        accessKeyId: CUSTOM_STORAGE.accessKeyId,
        secretAccessKey: CUSTOM_STORAGE.secretAccessKey,
      },
    })
  })

  afterEach(() => testApp.close())

  const createStorage = (name?: string) =>
    createStorageFactory(testApp)
      .inOrganization("acme", owner)
      .create(name ? { name } : {})

  const createCustomStorage = async () =>
    (await (await ownerClient.post(STORAGES_PATH, CUSTOM_STORAGE)).json()).data
      .storage as StorageDto

  /** A library on the storage with one uploaded video file. */
  const storeVideoIn = async (storage: StorageDto) => {
    const library = await createLibraryFactory(testApp)
      .inOrganization("acme", owner)
      .create()
    const videosPath = `/organizations/acme/libraries/${library.id}/videos`

    await ownerClient.put(
      `/organizations/acme/libraries/${library.id}/storage`,
      {
        storageId: storage.id,
      }
    )
    const { video } = (
      await (await ownerClient.post(videosPath, { title: "Clip" })).json()
    ).data

    await createTusClient(ownerClient, `${videosPath}/${video.id}`).upload(
      createFileBytes(VIDEO_FILE_HEADERS.MP4, 1024),
      "clip.mp4",
      1024
    )

    return library
  }

  describe("creating storages", () => {
    it("saves a reachable bucket without ever returning its credentials", async () => {
      const response = await ownerClient.post(STORAGES_PATH, CUSTOM_STORAGE)
      const body = await response.text()

      expect(response.status).toBe(201)
      expect(JSON.parse(body).data.storage).toEqual({
        id: expect.any(String),
        name: CUSTOM_STORAGE.name,
        endpoint: CUSTOM_STORAGE.endpoint,
        region: CUSTOM_STORAGE.region,
        bucket: CUSTOM_STORAGE.bucket,
        forcePathStyle: false,
        pathTemplate: CUSTOM_STORAGE.pathTemplate,
        accessKeyIdHint: "1234",
        libraryCount: 0,
        isLocked: false,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      })
      expect(body).not.toContain(CUSTOM_STORAGE.secretAccessKey)
      expect(body).not.toContain(CUSTOM_STORAGE.accessKeyId)
    })

    it("stores the credentials encrypted", async () => {
      const storage = await createCustomStorage()

      const [row] = await testApp.appModule.db
        .select()
        .from(storages)
        .where(eq(storages.id, storage.id))

      expect(JSON.stringify(row)).not.toContain(CUSTOM_STORAGE.secretAccessKey)
      expect(JSON.stringify(row)).not.toContain(CUSTOM_STORAGE.accessKeyId)
    })

    it("rejects a bucket the credentials cannot reach", async () => {
      const response = await ownerClient.post(STORAGES_PATH, {
        ...CUSTOM_STORAGE,
        secretAccessKey: "wrong-secret",
      })

      expect(response.status).toBe(422)
      expect((await response.json()).code).toBe("storage.unreachable")
    })

    it.each(REJECTED_PATH_TEMPLATES)(
      "rejects $description in the path template",
      async ({ pathTemplate }) => {
        const response = await ownerClient.post(STORAGES_PATH, {
          ...CUSTOM_STORAGE,
          pathTemplate,
        })

        expect(response.status).toBe(422)
      }
    )

    it.each(REJECTED_STORAGE_BODIES)(
      "rejects $description",
      async ({ body }) => {
        const response = await ownerClient.post(STORAGES_PATH, {
          ...CUSTOM_STORAGE,
          ...body,
        })

        expect(response.status).toBe(422)
      }
    )

    it("rejects private endpoints when they are not allowed", async () => {
      const strictApp = await createTestApp({
        STORAGE_ALLOW_PRIVATE_ENDPOINTS: "false",
      })
      const strictOwner = await createUserFactory(strictApp).create()
      await createOrganizationFactory(strictApp)
        .ownedBy(strictOwner)
        .create({ name: "Strict", slug: "strict" })
      const client = await signInAsUser(strictApp, strictOwner)
      const privateEndpoint = { endpoint: "http://169.254.169.254" }

      try {
        const responses = await Promise.all([
          client.post("/organizations/strict/storages", {
            ...CUSTOM_STORAGE,
            ...privateEndpoint,
          }),
          client.post("/organizations/strict/storages/connection-tests", {
            ...CUSTOM_CONNECTION,
            ...privateEndpoint,
          }),
        ])

        expect(responses.map((response) => response.status)).toEqual([422, 422])
        expect((await responses[1]!.json()).code).toBe(
          "storage.endpoint_not_allowed"
        )
      } finally {
        await strictApp.close()
      }
    })
  })

  describe("testing connections", () => {
    it("reports whether unsaved settings reach their bucket", async () => {
      const [reachable, unreachable] = await Promise.all([
        ownerClient.post(
          `${STORAGES_PATH}/connection-tests`,
          CUSTOM_CONNECTION
        ),
        ownerClient.post(`${STORAGES_PATH}/connection-tests`, {
          ...CUSTOM_CONNECTION,
          bucket: "missing-bucket",
        }),
      ])

      expect(reachable.status).toBe(200)
      expect((await reachable.json()).data.connection).toEqual({
        isReachable: true,
      })
      expect((await unreachable.json()).data.connection).toEqual({
        isReachable: false,
      })
    })

    it("checks a saved storage with its saved credentials", async () => {
      const storage = await createCustomStorage()
      const testPath = `${STORAGES_PATH}/${storage.id}/connection-tests`

      const reachable = await ownerClient.post(testPath)
      testApp.objectStorage.failRequests()
      const unreachable = await ownerClient.post(testPath)

      expect((await reachable.json()).data.connection.isReachable).toBe(true)
      expect((await unreachable.json()).data.connection.isReachable).toBe(false)
    })
  })

  describe("listing storages", () => {
    it("pages through the storages ordered by name", async () => {
      await createStorage("Gamma")
      await createStorage("Alpha")
      await createStorage("Beta")

      const [firstPage, secondPage] = await Promise.all(
        [1, 2].map(
          async (page) =>
            (
              await (
                await ownerClient.get(
                  `${STORAGES_PATH}?page=${page}&pageSize=2`
                )
              ).json()
            ).data
        )
      )

      expect(firstPage.storages.map(({ name }: StorageDto) => name)).toEqual([
        "Alpha",
        "Beta",
      ])
      expect(secondPage.storages.map(({ name }: StorageDto) => name)).toEqual([
        "Gamma",
      ])
      expect(secondPage.pagination).toEqual({
        page: 2,
        pageSize: 2,
        totalItems: 3,
        totalPages: 2,
      })
    })

    it("searches names and buckets case-insensitively, matching wildcards literally", async () => {
      await createStorage("Archive 100%")
      await createStorage("Archive 1000")
      await createCustomStorage()

      const search = async (term: string) =>
        (
          await (
            await ownerClient.get(
              `${STORAGES_PATH}?search=${encodeURIComponent(term)}`
            )
          ).json()
        ).data

      const [byName, byWildcard, byBucket] = await Promise.all([
        search("  archive "),
        search("100%"),
        search("ACME-VIDEOS"),
      ])

      expect(byName.pagination.totalItems).toBe(2)
      expect(byWildcard.storages.map(({ name }: StorageDto) => name)).toEqual([
        "Archive 100%",
      ])
      expect(byBucket.storages.map(({ name }: StorageDto) => name)).toEqual([
        CUSTOM_STORAGE.name,
      ])
    })

    it("rejects page sizes above the limit", async () => {
      const response = await ownerClient.get(`${STORAGES_PATH}?pageSize=101`)

      expect(response.status).toBe(422)
    })
  })

  describe("changing storages", () => {
    it("renames a storage and keeps its credentials when none are sent", async () => {
      const storage = await createCustomStorage()
      const {
        accessKeyId: _key,
        secretAccessKey: _secret,
        ...settings
      } = CUSTOM_STORAGE

      const response = await ownerClient.patch(
        `${STORAGES_PATH}/${storage.id}`,
        { ...settings, name: "Archive" }
      )
      const testResponse = await ownerClient.post(
        `${STORAGES_PATH}/${storage.id}/connection-tests`
      )

      expect(response.status).toBe(200)
      expect((await response.json()).data.storage).toEqual(
        expect.objectContaining({ name: "Archive", accessKeyIdHint: "1234" })
      )
      expect((await testResponse.json()).data.connection.isReachable).toBe(true)
    })

    it("rejects only one half of the credentials", async () => {
      const storage = await createCustomStorage()
      const { secretAccessKey: _secret, ...settings } = CUSTOM_STORAGE

      const response = await ownerClient.patch(
        `${STORAGES_PATH}/${storage.id}`,
        settings
      )

      expect(response.status).toBe(422)
    })

    it("re-checks the bucket when the connection changes", async () => {
      const storage = await createCustomStorage()

      const response = await ownerClient.patch(
        `${STORAGES_PATH}/${storage.id}`,
        { ...CUSTOM_STORAGE, bucket: "missing-bucket" }
      )

      expect(response.status).toBe(422)
      expect((await response.json()).code).toBe("storage.unreachable")
    })

    it("fixes the bucket and path template once a video file was stored, but allows a rename", async () => {
      const storage = await createCustomStorage()

      await storeVideoIn(storage)
      const [moved, renamed] = await Promise.all([
        ownerClient.patch(`${STORAGES_PATH}/${storage.id}`, {
          ...CUSTOM_STORAGE,
          pathTemplate: "{videoId}",
        }),
        ownerClient.patch(`${STORAGES_PATH}/${storage.id}`, {
          ...CUSTOM_STORAGE,
          name: "Renamed",
        }),
      ])

      expect([moved.status, renamed.status]).toEqual([409, 200])
      expect((await moved.json()).code).toBe("storage.locked")
      expect((await renamed.json()).data.storage).toEqual(
        expect.objectContaining({ isLocked: true, libraryCount: 1 })
      )
    })
  })

  describe("deleting storages", () => {
    it("deletes a storage no library uses", async () => {
      const storage = await createStorage()

      const response = await ownerClient.delete(
        `${STORAGES_PATH}/${storage.id}`
      )

      expect(response.status).toBe(200)
      expect(
        (await ownerClient.get(`${STORAGES_PATH}/${storage.id}`)).status
      ).toBe(404)
    })

    it("keeps a storage libraries use", async () => {
      const storage = await createStorage()
      const library = await createLibraryFactory(testApp)
        .inOrganization("acme", owner)
        .create()

      await ownerClient.put(
        `/organizations/acme/libraries/${library.id}/storage`,
        { storageId: storage.id }
      )
      const response = await ownerClient.delete(
        `${STORAGES_PATH}/${storage.id}`
      )

      expect(response.status).toBe(409)
      expect((await response.json()).code).toBe("storage.in_use")
    })
  })

  describe("access", () => {
    it("keeps storages away from members", async () => {
      const storage = await createStorage()

      const responses = await Promise.all([
        memberClient.get(STORAGES_PATH),
        memberClient.post(STORAGES_PATH, CUSTOM_STORAGE),
        memberClient.post(
          `${STORAGES_PATH}/connection-tests`,
          CUSTOM_CONNECTION
        ),
        memberClient.get(`${STORAGES_PATH}/${storage.id}`),
        memberClient.delete(`${STORAGES_PATH}/${storage.id}`),
      ])

      expect(responses.map((response) => response.status)).toEqual([
        403, 403, 403, 403, 403,
      ])
    })

    it("hides storages of other organizations", async () => {
      const outsider = await createUserFactory(testApp).create()

      await createOrganizationFactory(testApp)
        .ownedBy(outsider)
        .create({ name: "Globex", slug: "globex" })
      const storage = await createStorage()
      const outsiderClient = await signInAsUser(testApp, outsider)

      const responses = await Promise.all([
        outsiderClient.get(`${STORAGES_PATH}/${storage.id}`),
        outsiderClient.get(`/organizations/globex/storages/${storage.id}`),
        outsiderClient.delete(`/organizations/globex/storages/${storage.id}`),
      ])
      const { storages: globexStorages } = (
        await (
          await outsiderClient.get("/organizations/globex/storages")
        ).json()
      ).data

      expect(responses.map((response) => response.status)).toEqual([
        404, 404, 404,
      ])
      expect(globexStorages).toEqual([])
    })
  })
})
