import { ORGANIZATION_MEMBERSHIP_LIMIT } from "@workspace/shared"
import { afterEach, beforeEach, describe, expect, it } from "bun:test"

import { createOrganizationFactory } from "../../../test/factory/organization.factory"
import { createUserFactory } from "../../../test/factory/user.factory"
import { signInAsUser } from "../../../test/helpers/api-client"
import { expireInvitations } from "../../../test/helpers/organization-records"
import {
  findOrganizationEmails,
  latestInvitationId,
} from "../../../test/helpers/outbox"
import { createTestApp } from "../../../test/helpers/test-app"

import type { UserCredentials } from "../../../test/factory/user.factory"
import type { ApiClient } from "../../../test/helpers/api-client"
import type { TestApp } from "../../../test/helpers/test-app"

type TeamMember = { membershipId: string; email: string; role: string }

describe("Organization team (e2e)", () => {
  let testApp: TestApp
  let owner: UserCredentials
  let ownerClient: ApiClient
  let invitee: UserCredentials

  beforeEach(async () => {
    testApp = await createTestApp()
    owner = await createUserFactory(testApp).create({ name: "Olivia Owner" })
    invitee = await createUserFactory(testApp).create({ name: "Ivan Invitee" })
    ownerClient = await signInAsUser(testApp, owner)
  })

  afterEach(() => testApp.close())

  const createAcme = (...members: UserCredentials[]) =>
    createOrganizationFactory(testApp)
      .ownedBy(owner)
      .withMembers(...members)
      .create({ name: "Acme", slug: "acme" })

  const invite = (email: string, client = ownerClient) =>
    client.post("/organizations/acme/team/invitations", { email })

  const readTeam = async (client = ownerClient) =>
    (await (await client.get("/organizations/acme/team")).json()).data

  const findMember = async (email: string) =>
    (await readTeam()).members.find(
      (member: TeamMember) => member.email === email
    ) as TeamMember | undefined

  describe("inviting", () => {
    beforeEach(async () => {
      await createAcme()
    })

    it("emails a link to the inbox and lists the pending invitation", async () => {
      const response = await invite(` ${invitee.email.toUpperCase()} `)

      expect(response.status).toBe(201)
      expect((await response.json()).data.invitation).toEqual({
        invitationId: expect.any(String),
        email: invitee.email,
        status: "pending",
        expiresAt: expect.any(String),
        createdAt: expect.any(String),
      })
      expect(await findOrganizationEmails(testApp, invitee.email)).toEqual([
        expect.objectContaining({
          kind: "invitation",
          organizationName: "Acme",
          inviterName: "Olivia Owner",
          invitationUrl: expect.stringMatching(
            /^https:\/\/app\.openstream\.test\/inbox\?invitationId=/
          ),
        }),
      ])
      expect((await readTeam()).invitations).toEqual([
        expect.objectContaining({ email: invitee.email, status: "pending" }),
      ])
    })

    it("invites emails without an account", async () => {
      expect((await invite("newcomer@example.test")).status).toBe(201)
    })

    it("rejects a second pending invitation to the same email", async () => {
      await invite(invitee.email)

      const response = await invite(invitee.email)

      expect(response.status).toBe(409)
      expect(await response.json()).toEqual({
        code: "organization.invitation.already_pending",
        message: expect.any(String),
        reason: "organization.pending_invitation",
      })
    })

    it("replaces an expired invitation", async () => {
      await invite(invitee.email)
      await expireInvitations(testApp)

      expect((await invite(invitee.email)).status).toBe(201)
    })
  })

  describe("with a member", () => {
    let memberClient: ApiClient

    beforeEach(async () => {
      await createAcme(invitee)
      memberClient = await signInAsUser(testApp, invitee)
    })

    it("rejects inviting a member", async () => {
      const response = await invite(invitee.email)

      expect(response.status).toBe(409)
      expect(await response.json()).toEqual({
        code: "organization.invitation.already_member",
        message: expect.any(String),
        reason: "organization.already_member",
      })
    })

    it("forbids members from inviting", async () => {
      const response = await invite("someone@example.test", memberClient)

      expect(response.status).toBe(403)
    })

    it("hides invitations from members", async () => {
      await invite("someone@example.test")

      expect((await readTeam(memberClient)).invitations).toEqual([])
    })
  })

  describe("answering an invitation", () => {
    let inviteeClient: ApiClient
    let invitationId: string

    beforeEach(async () => {
      await createAcme()
      await invite(invitee.email)
      inviteeClient = await signInAsUser(testApp, invitee)
      invitationId = await latestInvitationId(testApp, invitee.email)
    })

    const accept = (client = inviteeClient) =>
      client.post(`/invitations/${invitationId}/accept`)

    it("lists the invitation in the invitee's context", async () => {
      const context = (
        await (await inviteeClient.get("/organizations/context")).json()
      ).data

      expect(context.pendingInvitations).toEqual([
        {
          invitationId,
          expiresAt: expect.any(String),
          organization: expect.objectContaining({ slug: "acme" }),
        },
      ])
    })

    it("joins as a member and notifies the owner", async () => {
      const response = await accept()

      expect(response.status).toBe(200)
      expect((await response.json()).data.organization).toMatchObject({
        slug: "acme",
      })
      expect(await findMember(invitee.email)).toMatchObject({ role: "member" })
      expect((await readTeam()).invitations).toEqual([])
      expect(await findOrganizationEmails(testApp, owner.email)).toEqual([
        expect.objectContaining({
          kind: "invitation-accepted",
          memberName: "Ivan Invitee",
        }),
      ])
    })

    it("cannot be accepted twice", async () => {
      await accept()

      expect((await accept()).status).toBe(409)
    })

    it("rejects another account", async () => {
      const otherClient = await signInAsUser(
        testApp,
        await createUserFactory(testApp).create()
      )

      const response = await accept(otherClient)

      expect(response.status).toBe(403)
      expect(await response.json()).toEqual({
        code: "organization.invitation.email_mismatch",
        message: expect.any(String),
        reason: "organization.invitation_email_mismatch",
      })
    })

    it("rejects an expired invitation", async () => {
      await expireInvitations(testApp)

      const response = await accept()

      expect(response.status).toBe(410)
      expect((await readTeam()).invitations).toEqual([
        expect.objectContaining({ status: "expired" }),
      ])
    })

    it("can be accepted again after the owner resends it", async () => {
      await expireInvitations(testApp)

      const response = await ownerClient.post(
        `/organizations/acme/team/invitations/${invitationId}/resend`
      )

      expect(response.status).toBe(200)
      expect((await response.json()).data.invitation.status).toBe("pending")
      expect(await findOrganizationEmails(testApp, invitee.email)).toHaveLength(
        2
      )
      expect((await accept()).status).toBe(200)
    })

    it("cannot be accepted once canceled", async () => {
      const response = await ownerClient.delete(
        `/organizations/acme/team/invitations/${invitationId}`
      )

      expect(response.status).toBe(200)
      expect((await accept()).status).toBe(409)
      expect((await readTeam()).invitations).toEqual([])
    })

    it("is gone from the context once declined", async () => {
      const response = await inviteeClient.post(
        `/invitations/${invitationId}/decline`
      )
      const context = (
        await (await inviteeClient.get("/organizations/context")).json()
      ).data

      expect(response.status).toBe(200)
      expect(context.pendingInvitations).toEqual([])
      expect((await accept()).status).toBe(409)
    })

    it("respects the invitee's membership limit", async () => {
      await createOrganizationFactory(testApp)
        .ownedBy(invitee)
        .createList(ORGANIZATION_MEMBERSHIP_LIMIT)

      const response = await accept()

      expect(response.status).toBe(409)
      expect(await response.json()).toEqual({
        code: "organization.membership_limit_reached",
        message: expect.any(String),
        reason: "organization.membership_limit_reached",
      })
    })
  })

  describe("removing and leaving", () => {
    let memberClient: ApiClient

    beforeEach(async () => {
      await createAcme(invitee)
      memberClient = await signInAsUser(testApp, invitee)
    })

    it("lets the owner remove a member, who loses access", async () => {
      const member = await findMember(invitee.email)

      const response = await ownerClient.delete(
        `/organizations/acme/team/members/${member!.membershipId}`
      )

      expect(response.status).toBe(200)
      expect((await memberClient.get("/organizations/acme")).status).toBe(404)
      expect(
        await findOrganizationEmails(testApp, invitee.email)
      ).toContainEqual(expect.objectContaining({ kind: "member-removed" }))
    })

    it("does not remove the owner", async () => {
      const ownerMember = await findMember(owner.email)

      const response = await ownerClient.delete(
        `/organizations/acme/team/members/${ownerMember!.membershipId}`
      )

      expect(response.status).toBe(404)
    })

    it("lets a member leave and notifies the owner", async () => {
      const response = await memberClient.delete(
        "/organizations/acme/members/me"
      )

      expect(response.status).toBe(200)
      expect(await findMember(invitee.email)).toBeUndefined()
      expect(await findOrganizationEmails(testApp, owner.email)).toContainEqual(
        expect.objectContaining({
          kind: "member-left",
          memberName: "Ivan Invitee",
        })
      )
    })

    it("does not let the owner leave", async () => {
      const response = await ownerClient.delete(
        "/organizations/acme/members/me"
      )

      expect(response.status).toBe(409)
      expect(await response.json()).toEqual({
        code: "organization.leave.fail",
        message: expect.any(String),
        reason: "organization.owner_cannot_leave",
      })
    })
  })

  describe("transferring ownership", () => {
    let memberClient: ApiClient

    beforeEach(async () => {
      await createAcme(invitee)
      memberClient = await signInAsUser(testApp, invitee)
    })

    const transfer = async (organizationName: string, membershipId?: string) =>
      ownerClient.post("/organizations/acme/ownership-transfer", {
        membershipId:
          membershipId ?? (await findMember(invitee.email))!.membershipId,
        organizationName,
      })

    it("swaps the roles and notifies both", async () => {
      const response = await transfer("Acme")

      expect(response.status).toBe(200)
      expect(await findMember(invitee.email)).toMatchObject({ role: "owner" })
      expect(await findMember(owner.email)).toMatchObject({ role: "member" })
      expect(
        await findOrganizationEmails(testApp, invitee.email)
      ).toContainEqual(expect.objectContaining({ kind: "ownership-received" }))
      expect(await findOrganizationEmails(testApp, owner.email)).toContainEqual(
        expect.objectContaining({ kind: "ownership-handed-over" })
      )
      expect(
        (await memberClient.patch("/organizations/acme", { name: "Renamed" }))
          .status
      ).toBe(200)
    })

    it("requires the exact organization name", async () => {
      const response = await transfer("acme")

      expect(response.status).toBe(422)
      expect(await response.json()).toEqual({
        code: "organization.confirmation_mismatch",
        message: expect.any(String),
        reason: "organization.confirmation_mismatch",
      })
    })

    it("only transfers to a member", async () => {
      const ownerMember = await findMember(owner.email)

      const response = await transfer("Acme", ownerMember!.membershipId)

      expect(response.status).toBe(422)
      expect(await response.json()).toEqual({
        code: "organization.ownership_transfer.fail",
        message: expect.any(String),
        reason: "organization.invalid_ownership_recipient",
      })
    })
  })
})
