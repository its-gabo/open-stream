import { afterEach, beforeEach, describe, expect, it } from "bun:test"
import { eq } from "drizzle-orm"

import { createLibraryFactory } from "../../../test/factory/library.factory"
import { createOrganizationFactory } from "../../../test/factory/organization.factory"
import { createStorageFactory } from "../../../test/factory/storage.factory"
import { createUserFactory } from "../../../test/factory/user.factory"
import { createApiClient, signInAsUser } from "../../../test/helpers/api-client"
import { createLibraryApiClient } from "../../../test/helpers/library-api-client"
import { endDeletionGracePeriods } from "../../../test/helpers/organization-records"
import {
  latestDeletionTokens,
  latestEmailToken,
} from "../../../test/helpers/outbox"
import { createTestApp } from "../../../test/helpers/test-app"
import { activityLogs } from "../../db/schema"
import { VALID_DELETION_CONFIRMATION } from "../../organizations/__tests__/organization-deletion.scenarios"

import type { UserCredentials } from "../../../test/factory/user.factory"
import type { ApiClient } from "../../../test/helpers/api-client"
import type { TestApp } from "../../../test/helpers/test-app"
import type { LibraryDto } from "../../libraries/dto/libraries.schemas"
import type { ActivityLogDto } from "../dto/activity.schemas"

describe("Activity log (e2e)", () => {
  let testApp: TestApp
  let owner: UserCredentials
  let member: UserCredentials
  let ownerClient: ApiClient
  let memberClient: ApiClient
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
    ownerClient = await signInAsUser(testApp, owner)
    memberClient = await signInAsUser(testApp, member)
  })

  afterEach(() => testApp.close())

  const listActivity = async (
    query = ""
  ): Promise<{
    activities: ActivityLogDto[]
    pagination: { totalItems: number }
  }> =>
    (
      await (
        await ownerClient.get(`/organizations/acme/activity${query}`)
      ).json()
    ).data

  const latestActivity = async () => (await listActivity()).activities[0]!

  it("records who changed what, when and from where, with the values before and after", async () => {
    await ownerClient.request(libraryPath, {
      method: "PATCH",
      body: { name: "Brand" },
      headers: {
        "x-forwarded-for": "203.0.113.7, 10.0.0.2",
        "user-agent": "Activity test",
      },
    })

    expect(await latestActivity()).toEqual({
      id: expect.any(String),
      action: "library.updated",
      actor: {
        kind: "user",
        userId: expect.any(String),
        apiKeyId: null,
        label: `${owner.name} <${owner.email}>`,
      },
      resource: { type: "library", id: library.id, label: "Brand" },
      before: { name: "Marketing" },
      after: { name: "Brand" },
      context: {},
      ipAddress: "203.0.113.7",
      userAgent: "Activity test",
      createdAt: expect.any(String),
    })
  })

  it("names the API key behind library API changes", async () => {
    const { apiKey, secret } = (
      await (
        await ownerClient.post(`${libraryPath}/api-keys`, {
          name: "Ingest server",
          scopes: ["videos:upload"],
        })
      ).json()
    ).data

    await createLibraryApiClient(testApp, secret).post(
      `/libraries/${library.id}/videos`,
      { title: "From the API" }
    )

    expect(await latestActivity()).toEqual(
      expect.objectContaining({
        action: "video.created",
        actor: {
          kind: "api_key",
          userId: null,
          apiKeyId: apiKey.id,
          label: "Ingest server",
        },
        after: { title: "From the API" },
        context: { libraryId: library.id, libraryName: "Marketing" },
      })
    )
  })

  it("keeps what a deleted video was", async () => {
    const { video } = (
      await (
        await memberClient.post(`${libraryPath}/videos`, { title: "Gone" })
      ).json()
    ).data

    await memberClient.delete(`${libraryPath}/videos/${video.id}`)

    expect(await latestActivity()).toEqual(
      expect.objectContaining({
        action: "video.deleted",
        resource: { type: "video", id: video.id, label: "Gone" },
        before: expect.objectContaining({ title: "Gone", status: "draft" }),
        after: null,
      })
    )
  })

  it("never records secrets", async () => {
    const storage = await createStorageFactory(testApp)
      .inOrganization("acme", owner)
      .create({ secretAccessKey: "storage-secret-value" })
    const { secret } = (
      await (
        await ownerClient.post(`${libraryPath}/api-keys`, {
          name: "Key",
          scopes: ["videos:read"],
        })
      ).json()
    ).data
    const { signingSecret } = (
      await (
        await ownerClient.put(`${libraryPath}/webhook`, {
          url: "https://hooks.example.com/openstream",
        })
      ).json()
    ).data

    const recorded = JSON.stringify(await listActivity("?pageSize=100"))

    expect(recorded).toContain(storage.id)
    for (const value of ["storage-secret-value", secret, signingSecret]) {
      expect(recorded).not.toContain(value)
    }
  })

  it("records the team's changes", async () => {
    const team = (
      await (await ownerClient.get("/organizations/acme/team")).json()
    ).data
    const memberEntry = team.members.find(
      ({ email }: { email: string }) => email === member.email
    )

    await ownerClient.post("/organizations/acme/team/invitations", {
      email: "new@example.com",
    })
    await ownerClient.delete(
      `/organizations/acme/team/members/${memberEntry.membershipId}`
    )

    expect(
      (await listActivity()).activities
        .slice(0, 2)
        .map(({ action, resource }) => ({ action, label: resource.label }))
    ).toEqual([
      {
        action: "membership.removed",
        label: `${member.name} <${member.email}>`,
      },
      { action: "invitation.created", label: "new@example.com" },
    ])
  })

  it("pages, filters and searches the activity, newest first", async () => {
    for (const title of ["One", "Two", "Three"]) {
      await memberClient.post(`${libraryPath}/videos`, { title })
    }

    const videos = await listActivity("?resourceType=video")
    const firstPage = await listActivity("?resourceType=video&pageSize=2")
    const search = await listActivity("?search=two")
    const forLibrary = await listActivity(
      `?resourceType=library&resourceId=${library.id}`
    )

    expect(videos.activities.map(({ resource }) => resource.label)).toEqual([
      "Three",
      "Two",
      "One",
    ])
    expect(firstPage.activities).toHaveLength(2)
    expect(firstPage.pagination.totalItems).toBe(3)
    expect(search.activities.map(({ resource }) => resource.label)).toEqual([
      "Two",
    ])
    expect(forLibrary.activities.map(({ action }) => action)).toEqual([
      "library.created",
    ])
  })

  describe("account activity", () => {
    const readAccountActivity = async (
      client: ApiClient
    ): Promise<ActivityLogDto[]> =>
      (await (await client.get("/account/activity")).json()).data.activities

    it("records sign-ups, verification, sign-ins, failed sign-ins and sign-outs", async () => {
      const newcomer = await createUserFactory(testApp).create()
      const signInClient = createApiClient(testApp)

      await signInClient.request("/auth/sign-in/email", {
        method: "POST",
        body: { email: newcomer.email, password: "wrong-password" },
        headers: { "x-forwarded-for": "198.51.100.4" },
      })
      const client = await signInAsUser(testApp, newcomer)
      const otherClient = await signInAsUser(testApp, newcomer)
      await otherClient.post("/auth/sign-out")

      const activities = await readAccountActivity(client)

      expect(
        activities.map(({ action, actor }) => ({ action, actor: actor.kind }))
      ).toEqual([
        { action: "account.signed_out", actor: "user" },
        { action: "account.signed_in", actor: "user" },
        { action: "account.signed_in", actor: "user" },
        { action: "account.sign_in_failed", actor: "anonymous" },
        { action: "account.email_verified", actor: "user" },
        { action: "account.signed_up", actor: "user" },
      ])
      expect(activities[3]).toEqual(
        expect.objectContaining({
          actor: expect.objectContaining({ label: newcomer.email }),
          context: { reason: "invalid_credentials" },
          ipAddress: "198.51.100.4",
        })
      )
    })

    it("records a sign-in refused for an unverified email", async () => {
      const unverified = await createUserFactory(testApp).unverified().create()

      const response = await createApiClient(testApp).post(
        "/auth/sign-in/email",
        { email: unverified.email, password: unverified.password }
      )
      const [failed] = await testApp.appModule.db
        .select()
        .from(activityLogs)
        .where(eq(activityLogs.action, "account.sign_in_failed"))

      expect(response.status).toBe(403)
      expect(failed).toEqual(
        expect.objectContaining({
          accountUserId: expect.any(String),
          organizationId: null,
          context: { reason: "email_not_verified" },
        })
      )
    })

    it("records nothing for a sign-in with an unknown email", async () => {
      const response = await createApiClient(testApp).post(
        "/auth/sign-in/email",
        { email: "nobody@example.com", password: "whatever-password" }
      )

      const failed = await testApp.appModule.db
        .select()
        .from(activityLogs)
        .where(eq(activityLogs.action, "account.sign_in_failed"))

      expect(response.status).toBe(401)
      expect(failed).toEqual([])
    })

    it("records password resets", async () => {
      const guest = createApiClient(testApp)

      await guest.post("/auth/forgot-password", { email: member.email })
      await guest.post("/auth/reset-password", {
        token: await latestEmailToken(testApp, member.email),
        password: "a-brand-new-password",
      })
      const client = await signInAsUser(testApp, {
        ...member,
        password: "a-brand-new-password",
      })

      expect(
        (await readAccountActivity(client))
          .slice(1, 3)
          .map(({ action, actor }) => ({ action, actor: actor.kind }))
      ).toEqual([
        { action: "account.password_reset", actor: "user" },
        { action: "account.password_reset_requested", actor: "anonymous" },
      ])
    })

    it("keeps account activity out of organization logs and away from other members", async () => {
      const organizationActions = (
        await listActivity("?pageSize=100")
      ).activities.map(({ action }) => action)
      const memberActivity = await readAccountActivity(memberClient)

      expect(
        organizationActions.some((action) => action.startsWith("account."))
      ).toBe(false)
      expect(
        memberActivity.every(
          ({ resource }) =>
            resource.label === `${member.name} <${member.email}>`
        )
      ).toBe(true)
    })
  })

  describe("organization deletion", () => {
    const scheduleDeletion = () =>
      ownerClient.post(
        "/organizations/acme/deletion",
        VALID_DELETION_CONFIRMATION
      )

    it("stays readable while the organization is pending deletion", async () => {
      await scheduleDeletion()

      const response = await ownerClient.get("/organizations/acme/activity")
      const [latest] = (await response.json()).data.activities

      expect(response.status).toBe(200)
      expect(latest).toEqual(
        expect.objectContaining({
          action: "organization.deletion_scheduled",
          before: { status: "active" },
          after: {
            status: "pending_deletion",
            scheduledFor: expect.any(String),
          },
        })
      )
    })

    it("records a canceled deletion", async () => {
      await scheduleDeletion()
      await ownerClient.delete("/organizations/acme/deletion")

      expect(await latestActivity()).toEqual(
        expect.objectContaining({
          action: "organization.deletion_canceled",
          after: { status: "active" },
        })
      )
    })

    it("keeps the record of a deletion by the owner, in the owner's own activity", async () => {
      await scheduleDeletion()
      const { deleteToken } = await latestDeletionTokens(testApp, owner.email)

      await ownerClient.post("/organization-deletion-actions/delete", {
        token: deleteToken,
      })
      const [deleted] = (
        await (await ownerClient.get("/account/activity")).json()
      ).data.activities

      expect(deleted).toEqual(
        expect.objectContaining({
          action: "organization.deleted",
          actor: expect.objectContaining({ kind: "user" }),
          resource: expect.objectContaining({
            type: "organization",
            label: "Acme",
          }),
          before: { name: "Acme", slug: "acme" },
        })
      )
    })

    it("records OpenStream as deleting an organization once its grace period ends", async () => {
      await scheduleDeletion()
      await endDeletionGracePeriods(testApp)

      await testApp.appModule.organizationSweeperService.sweep()
      const [deleted] = (
        await (await ownerClient.get("/account/activity")).json()
      ).data.activities

      expect(deleted).toEqual(
        expect.objectContaining({
          action: "organization.deleted",
          actor: {
            kind: "system",
            userId: null,
            apiKeyId: null,
            label: "OpenStream",
          },
        })
      )
    })
  })

  it("shows the activity to the owner only, and only their organization's", async () => {
    const outsider = await createUserFactory(testApp).create()
    await createOrganizationFactory(testApp)
      .ownedBy(outsider)
      .create({ name: "Globex", slug: "globex" })
    const outsiderClient = await signInAsUser(testApp, outsider)

    const memberResponse = await memberClient.get(
      "/organizations/acme/activity"
    )
    const outsiderResponse = await outsiderClient.get(
      "/organizations/acme/activity"
    )
    const globex = (
      await (await outsiderClient.get("/organizations/globex/activity")).json()
    ).data.activities

    expect([memberResponse.status, outsiderResponse.status]).toEqual([403, 404])
    expect(globex.map(({ action }: ActivityLogDto) => action)).toEqual([
      "organization.created",
    ])
  })
})
