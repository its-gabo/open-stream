import { afterEach, beforeEach, describe, expect, it } from "bun:test"

import { createOrganizationFactory } from "../../../test/factory/organization.factory"
import { createUserFactory } from "../../../test/factory/user.factory"
import { signInAsUser } from "../../../test/helpers/api-client"
import {
  endDeletionGracePeriods,
  findDeletionRequest,
} from "../../../test/helpers/organization-records"
import {
  findOrganizationEmails,
  latestDeletionTokens,
} from "../../../test/helpers/outbox"
import { createTestApp } from "../../../test/helpers/test-app"
import { DAY_MS } from "../../common/time/time.constants"
import { ORGANIZATION_DELETION_DELAY_DAYS } from "../constants/organizations.constants"
import {
  REJECTED_DELETION_CONFIRMATIONS,
  VALID_DELETION_CONFIRMATION,
} from "./organization-deletion.scenarios"

import type { UserCredentials } from "../../../test/factory/user.factory"
import type { ApiClient } from "../../../test/helpers/api-client"
import type { TestApp } from "../../../test/helpers/test-app"

describe("Organization deletion (e2e)", () => {
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

  const scheduleDeletion = (body: object = VALID_DELETION_CONFIRMATION) =>
    ownerClient.post("/organizations/acme/deletion", body)

  const readOrganization = async () =>
    (await (await ownerClient.get("/organizations/acme")).json()).data
      .organization

  describe("scheduling", () => {
    it("disables the organization until the grace period ends", async () => {
      const response = await scheduleDeletion()
      const { organization } = (await response.json()).data

      expect(response.status).toBe(200)
      expect(organization.status).toBe("pending_deletion")
      expect(
        new Date(organization.scheduledDeletionAt).getTime() - Date.now()
      ).toBeWithin(
        ORGANIZATION_DELETION_DELAY_DAYS * DAY_MS - 60_000,
        ORGANIZATION_DELETION_DELAY_DAYS * DAY_MS + 1
      )
      expect(await readOrganization()).toMatchObject({
        status: "pending_deletion",
      })
    })

    it("emails the owner links to cancel or delete now", async () => {
      await scheduleDeletion()

      expect(await findOrganizationEmails(testApp, owner.email)).toContainEqual(
        expect.objectContaining({
          kind: "deletion-scheduled",
          cancelUrl: expect.stringMatching(
            /\/organization-deletion\?action=cancel&token=[a-f0-9]{64}$/
          ),
          deleteUrl: expect.stringMatching(
            /\/organization-deletion\?action=delete&token=[a-f0-9]{64}$/
          ),
        })
      )
    })

    it("blocks changes while pending deletion", async () => {
      await scheduleDeletion()

      const responses = await Promise.all([
        ownerClient.patch("/organizations/acme", { name: "Renamed" }),
        ownerClient.get("/organizations/acme/team"),
        memberClient.delete("/organizations/acme/members/me"),
        scheduleDeletion(),
      ])

      expect(responses.map((response) => response.status)).toEqual([
        423, 423, 423, 423,
      ])
    })

    it.each(REJECTED_DELETION_CONFIRMATIONS)(
      "rejects $description",
      async ({ body }) => {
        const response = await scheduleDeletion(body)

        expect(response.status).toBe(422)
        expect(await response.json()).toEqual({
          code: "organization.confirmation_mismatch",
          message: expect.any(String),
          reason: "organization.confirmation_mismatch",
        })
        expect(await readOrganization()).toMatchObject({ status: "active" })
      }
    )

    it("forbids members", async () => {
      const response = await memberClient.post(
        "/organizations/acme/deletion",
        VALID_DELETION_CONFIRMATION
      )

      expect(response.status).toBe(403)
      expect(await response.json()).toEqual({
        code: "organization.forbidden",
        message: expect.any(String),
        reason: "organization.owner_required",
      })
    })
  })

  describe("canceling", () => {
    beforeEach(async () => {
      await scheduleDeletion()
    })

    it("reactivates the organization from its settings", async () => {
      const response = await ownerClient.delete("/organizations/acme/deletion")

      expect(response.status).toBe(200)
      expect(await readOrganization()).toMatchObject({
        status: "active",
        scheduledDeletionAt: null,
      })
      expect(await findOrganizationEmails(testApp, owner.email)).toContainEqual(
        expect.objectContaining({ kind: "deletion-canceled" })
      )
    })

    it("reactivates the organization with the emailed link once", async () => {
      const { cancelToken } = await latestDeletionTokens(testApp, owner.email)

      const response = await ownerClient.post(
        "/organization-deletion-actions/cancel",
        { token: cancelToken }
      )

      expect(response.status).toBe(200)
      expect(await readOrganization()).toMatchObject({ status: "active" })
      expect(
        (
          await ownerClient.post("/organization-deletion-actions/cancel", {
            token: cancelToken,
          })
        ).status
      ).toBe(422)
    })

    it("rejects the link for anyone but the owner", async () => {
      const { cancelToken } = await latestDeletionTokens(testApp, owner.email)

      const response = await memberClient.post(
        "/organization-deletion-actions/cancel",
        { token: cancelToken }
      )

      expect(response.status).toBe(422)
      expect(await readOrganization()).toMatchObject({
        status: "pending_deletion",
      })
    })

    it("rejects the link after the grace period", async () => {
      const { cancelToken } = await latestDeletionTokens(testApp, owner.email)
      await endDeletionGracePeriods(testApp)

      const response = await ownerClient.post(
        "/organization-deletion-actions/cancel",
        { token: cancelToken }
      )

      expect(response.status).toBe(422)
    })

    it("fails when no deletion is scheduled", async () => {
      await ownerClient.delete("/organizations/acme/deletion")

      expect(
        (await ownerClient.delete("/organizations/acme/deletion")).status
      ).toBe(409)
    })
  })

  describe("deleting", () => {
    beforeEach(async () => {
      await scheduleDeletion()
    })

    it("deletes right away with the emailed link", async () => {
      const { deleteToken } = await latestDeletionTokens(testApp, owner.email)

      const response = await ownerClient.post(
        "/organization-deletion-actions/delete",
        { token: deleteToken }
      )

      expect(response.status).toBe(200)
      expect((await ownerClient.get("/organizations/acme")).status).toBe(404)
      expect((await memberClient.get("/organizations/acme")).status).toBe(404)
      expect(await findOrganizationEmails(testApp, owner.email)).toContainEqual(
        expect.objectContaining({ kind: "deleted", organizationName: "Acme" })
      )
    })

    it("rejects the delete link for anyone but the owner", async () => {
      const { deleteToken } = await latestDeletionTokens(testApp, owner.email)

      const response = await memberClient.post(
        "/organization-deletion-actions/delete",
        { token: deleteToken }
      )

      expect(response.status).toBe(422)
      expect((await ownerClient.get("/organizations/acme")).status).toBe(200)
    })

    it("is done by the worker sweep once the grace period ends", async () => {
      const { id } = await readOrganization()
      const { organizationSweeperService } = testApp.appModule

      await organizationSweeperService.sweep()
      expect(await findDeletionRequest(testApp, id)).not.toBeNull()

      await endDeletionGracePeriods(testApp)
      await organizationSweeperService.sweep()

      expect(await findDeletionRequest(testApp, id)).toBeNull()
      expect((await ownerClient.get("/organizations/acme")).status).toBe(404)
      expect(await findOrganizationEmails(testApp, owner.email)).toContainEqual(
        expect.objectContaining({ kind: "deleted" })
      )
    })
  })
})
