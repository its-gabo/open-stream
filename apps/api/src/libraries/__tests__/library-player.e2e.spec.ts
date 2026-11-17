import { afterEach, beforeEach, describe, expect, it } from "bun:test"

import { DEFAULT_LIBRARY_PLAYER_SETTINGS } from "@workspace/shared"
import { sql } from "drizzle-orm"

import { createLibraryFactory } from "../../../test/factory/library.factory"
import { createOrganizationFactory } from "../../../test/factory/organization.factory"
import { createUserFactory } from "../../../test/factory/user.factory"
import { signInAsUser } from "../../../test/helpers/api-client"
import { createTestApp } from "../../../test/helpers/test-app"
import { INVALID_PLAYER_SETTINGS } from "./library-player.scenarios"

import type { ApiClient } from "../../../test/helpers/api-client"
import type { TestApp } from "../../../test/helpers/test-app"
import type { ActivityLogDto } from "../../activity/dto/activity.schemas"

const BRANDED_PLAYER = {
  accentColor: "#e11d48",
  showTitle: false,
  showSettingsMenu: true,
  showPictureInPicture: false,
  showFullscreen: true,
}

describe("Library player settings (e2e)", () => {
  let testApp: TestApp
  let ownerClient: ApiClient
  let memberClient: ApiClient
  let libraryId: string
  let playerPath: string

  beforeEach(async () => {
    testApp = await createTestApp()
    const owner = await createUserFactory(testApp).create()
    const member = await createUserFactory(testApp).create()

    await createOrganizationFactory(testApp)
      .ownedBy(owner)
      .withMembers(member)
      .create({ name: "Acme", slug: "acme" })
    libraryId = (
      await createLibraryFactory(testApp)
        .inOrganization("acme", owner)
        .create({ name: "Marketing" })
    ).id
    playerPath = `/organizations/acme/libraries/${libraryId}/player`
    ownerClient = await signInAsUser(testApp, owner)
    memberClient = await signInAsUser(testApp, member)
  })

  afterEach(() => testApp.close())

  const readPlayer = async () =>
    (await (await ownerClient.get(playerPath)).json()).data.player

  it("starts with the stock player", async () => {
    const response = await ownerClient.get(playerPath)

    expect(response.status).toBe(200)
    expect((await response.json()).data.player).toEqual(
      DEFAULT_LIBRARY_PLAYER_SETTINGS
    )
  })

  it("lets the owner brand the player and keeps the color lowercase", async () => {
    const response = await ownerClient.put(playerPath, {
      ...BRANDED_PLAYER,
      accentColor: " #E11D48 ",
    })

    expect(response.status).toBe(200)
    expect((await response.json()).data.player).toEqual(BRANDED_PLAYER)
    expect(await readPlayer()).toEqual(BRANDED_PLAYER)
  })

  it("records the changed settings in the activity log", async () => {
    await ownerClient.put(playerPath, BRANDED_PLAYER)

    const [activity] = (
      await (
        await ownerClient.get(
          `/organizations/acme/activity?resourceType=library&resourceId=${libraryId}`
        )
      ).json()
    ).data.activities as ActivityLogDto[]

    expect(activity).toEqual(
      expect.objectContaining({
        action: "library.player_updated",
        resource: { type: "library", id: libraryId, label: "Marketing" },
        before: {
          accentColor: "#ffffff",
          showTitle: true,
          showPictureInPicture: true,
        },
        after: {
          accentColor: "#e11d48",
          showTitle: false,
          showPictureInPicture: false,
        },
      })
    )
  })

  it("records nothing when the settings stay the same", async () => {
    const listPlayerActivity = async () =>
      (
        (
          await (
            await ownerClient.get(
              `/organizations/acme/activity?resourceType=library&resourceId=${libraryId}`
            )
          ).json()
        ).data.activities as ActivityLogDto[]
      ).filter((activity) => activity.action === "library.player_updated")

    const unchanged = await ownerClient.put(
      playerPath,
      DEFAULT_LIBRARY_PLAYER_SETTINGS
    )
    await ownerClient.put(playerPath, BRANDED_PLAYER)
    const repeated = await ownerClient.put(playerPath, {
      ...BRANDED_PLAYER,
      accentColor: "#E11D48",
    })

    expect(unchanged.status).toBe(200)
    expect((await unchanged.json()).data.player).toEqual(
      DEFAULT_LIBRARY_PLAYER_SETTINGS
    )
    expect(repeated.status).toBe(200)
    expect((await repeated.json()).data.player).toEqual(BRANDED_PLAYER)
    expect(await listPlayerActivity()).toHaveLength(1)
  })

  it("keeps the old settings when the change cannot be recorded", async () => {
    const { db } = testApp.appModule

    await db.execute(sql`
      CREATE FUNCTION refuse_player_activity() RETURNS trigger AS $$
      BEGIN RAISE EXCEPTION 'activity log unavailable'; END
      $$ LANGUAGE plpgsql
    `)
    await db.execute(sql`
      CREATE TRIGGER refuse_player_activity BEFORE INSERT ON activity_logs
      FOR EACH ROW WHEN (NEW.action = 'library.player_updated')
      EXECUTE FUNCTION refuse_player_activity()
    `)

    try {
      const response = await ownerClient.put(playerPath, BRANDED_PLAYER)

      expect(response.status).toBe(500)
      expect(await readPlayer()).toEqual(DEFAULT_LIBRARY_PLAYER_SETTINGS)
    } finally {
      await db.execute(
        sql`DROP TRIGGER refuse_player_activity ON activity_logs`
      )
      await db.execute(sql`DROP FUNCTION refuse_player_activity()`)
    }
  })

  it("lets members read the player settings but not change them", async () => {
    await ownerClient.put(playerPath, BRANDED_PLAYER)

    const read = await memberClient.get(playerPath)
    const update = await memberClient.put(playerPath, {
      ...BRANDED_PLAYER,
      accentColor: "#0ea5e9",
    })

    expect(read.status).toBe(200)
    expect((await read.json()).data.player).toEqual(BRANDED_PLAYER)
    expect(update.status).toBe(403)
    expect(await readPlayer()).toEqual(BRANDED_PLAYER)
  })

  it("does not find a library of another organization", async () => {
    const response = await ownerClient.put(
      `/organizations/acme/libraries/${crypto.randomUUID()}/player`,
      BRANDED_PLAYER
    )

    expect(response.status).toBe(404)
  })

  it.each(INVALID_PLAYER_SETTINGS)("refuses $description", async ({ body }) => {
    const response = await ownerClient.put(playerPath, body)

    expect(response.status).toBe(422)
    expect(await readPlayer()).toEqual(DEFAULT_LIBRARY_PLAYER_SETTINGS)
  })
})
