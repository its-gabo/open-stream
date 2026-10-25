import { ORGANIZATION_MEMBERSHIP_LIMIT } from "@workspace/shared"
import { afterEach, beforeEach, describe, expect, it } from "bun:test"

import { createOrganizationFactory } from "../../../test/factory/organization.factory"
import { createUserFactory } from "../../../test/factory/user.factory"
import { createApiClient, signInAsUser } from "../../../test/helpers/api-client"
import { createTestApp } from "../../../test/helpers/test-app"
import {
  REJECTED_ORGANIZATION_BODIES,
  SLUG_SUGGESTIONS,
} from "./organizations.scenarios"

import type { UserCredentials } from "../../../test/factory/user.factory"
import type { ApiClient } from "../../../test/helpers/api-client"
import type { TestApp } from "../../../test/helpers/test-app"

describe("Organizations (e2e)", () => {
  let testApp: TestApp
  let owner: UserCredentials
  let ownerClient: ApiClient

  beforeEach(async () => {
    testApp = await createTestApp()
    owner = await createUserFactory(testApp).create()
    ownerClient = await signInAsUser(testApp, owner)
  })

  afterEach(() => testApp.close())

  const createOrganization = (name: string, slug: string) =>
    createOrganizationFactory(testApp).ownedBy(owner).create({ name, slug })

  const readContext = async (client: ApiClient) =>
    (await (await client.get("/organizations/context")).json()).data

  it("requires a session", async () => {
    const response = await createApiClient(testApp).get(
      "/organizations/context"
    )

    expect(response.status).toBe(401)
  })

  describe("creating", () => {
    it("makes the creator the owner of a new, selected organization", async () => {
      const response = await ownerClient.post("/organizations", {
        name: "  Acme Studios ",
        slug: "Acme-Studios",
      })

      expect(response.status).toBe(201)
      expect((await response.json()).data).toEqual({
        organization: {
          id: expect.any(String),
          name: "Acme Studios",
          slug: "acme-studios",
          status: "active",
          scheduledDeletionAt: null,
        },
        membership: { membershipId: expect.any(String), role: "owner" },
      })
      expect(await readContext(ownerClient)).toEqual({
        memberships: [
          expect.objectContaining({
            role: "owner",
            organization: expect.objectContaining({ slug: "acme-studios" }),
          }),
        ],
        pendingInvitations: [],
        membershipLimit: {
          used: 1,
          maximum: ORGANIZATION_MEMBERSHIP_LIMIT,
          reached: false,
        },
      })
    })

    it.each(REJECTED_ORGANIZATION_BODIES)(
      "rejects $description",
      async ({ body }) => {
        const response = await ownerClient.post("/organizations", body)

        expect(response.status).toBe(422)
      }
    )

    it("rejects a slug that is already taken", async () => {
      await createOrganization("Acme", "acme")

      const response = await ownerClient.post("/organizations", {
        name: "Other Acme",
        slug: "acme",
      })

      expect(response.status).toBe(409)
      expect(await response.json()).toEqual({
        code: "organization.slug_taken",
        message: expect.any(String),
        reason: "organization.slug_taken",
      })
    })

    it("stops at the membership limit", async () => {
      await createOrganizationFactory(testApp)
        .ownedBy(owner)
        .createList(ORGANIZATION_MEMBERSHIP_LIMIT)

      const response = await ownerClient.post("/organizations", {
        name: "One Too Many",
        slug: "one-too-many",
      })

      expect(response.status).toBe(409)
      expect(await response.json()).toEqual({
        code: "organization.membership_limit_reached",
        message: expect.any(String),
        reason: "organization.membership_limit_reached",
      })
      expect((await readContext(ownerClient)).membershipLimit).toEqual({
        used: ORGANIZATION_MEMBERSHIP_LIMIT,
        maximum: ORGANIZATION_MEMBERSHIP_LIMIT,
        reached: true,
      })
    })
  })

  describe("suggesting a slug", () => {
    it.each(SLUG_SUGGESTIONS)(
      'suggests "$slug" for "$name"',
      async ({ name, slug }) => {
        const response = await ownerClient.get(
          `/organizations/slug-suggestion?name=${encodeURIComponent(name)}`
        )

        expect((await response.json()).data).toEqual({ slug })
      }
    )

    it("numbers the slug when it is taken", async () => {
      await createOrganization("Acme", "acme")
      await createOrganization("Acme 2", "acme-2")

      const response = await ownerClient.get(
        "/organizations/slug-suggestion?name=Acme"
      )

      expect((await response.json()).data).toEqual({ slug: "acme-3" })
    })
  })

  describe("reading", () => {
    it("returns the organization with the caller's membership", async () => {
      await createOrganization("Acme", "acme")

      const response = await ownerClient.get("/organizations/acme")

      expect(response.status).toBe(200)
      expect((await response.json()).data).toEqual({
        organization: {
          id: expect.any(String),
          name: "Acme",
          slug: "acme",
          status: "active",
          scheduledDeletionAt: null,
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        },
        membership: { membershipId: expect.any(String), role: "owner" },
      })
    })

    it("hides organizations of other users", async () => {
      await createOrganization("Acme", "acme")
      const outsider = await signInAsUser(
        testApp,
        await createUserFactory(testApp).create()
      )

      const response = await outsider.get("/organizations/acme")

      expect(response.status).toBe(404)
      expect(await response.json()).toEqual({
        code: "organization.not_found",
        message: expect.any(String),
        reason: "organization.inaccessible",
      })
    })
  })

  describe("updating", () => {
    it("lets the owner rename the organization and change its slug", async () => {
      await createOrganization("Acme", "acme")

      const response = await ownerClient.patch("/organizations/acme", {
        name: "Acme Pictures",
        slug: "acme-pictures",
      })

      expect(response.status).toBe(200)
      expect((await response.json()).data.organization).toMatchObject({
        name: "Acme Pictures",
        slug: "acme-pictures",
      })
      expect((await ownerClient.get("/organizations/acme")).status).toBe(404)
      expect(
        (await ownerClient.get("/organizations/acme-pictures")).status
      ).toBe(200)
    })

    it("rejects a slug another organization uses", async () => {
      await createOrganization("Acme", "acme")
      await createOrganization("Globex", "globex")

      const response = await ownerClient.patch("/organizations/acme", {
        slug: "globex",
      })

      expect(response.status).toBe(409)
    })

    it("rejects an empty update", async () => {
      await createOrganization("Acme", "acme")

      expect((await ownerClient.patch("/organizations/acme", {})).status).toBe(
        422
      )
    })

    it("forbids members", async () => {
      const member = await createUserFactory(testApp).create()
      await createOrganizationFactory(testApp)
        .ownedBy(owner)
        .withMembers(member)
        .create({ name: "Acme", slug: "acme" })
      const memberClient = await signInAsUser(testApp, member)

      const response = await memberClient.patch("/organizations/acme", {
        name: "Hijacked",
      })

      expect(response.status).toBe(403)
      expect(await response.json()).toEqual({
        code: "organization.forbidden",
        message: expect.any(String),
        reason: "organization.owner_required",
      })
    })
  })

  describe("selecting", () => {
    it("lists the selected organization first", async () => {
      await createOrganization("Acme", "acme")
      await createOrganization("Globex", "globex")

      const response = await ownerClient.post("/organizations/acme/select")
      const { memberships } = await readContext(ownerClient)

      expect(response.status).toBe(200)
      expect(
        memberships.map(
          (membership: { organization: { slug: string } }) =>
            membership.organization.slug
        )
      ).toEqual(["acme", "globex"])
    })
  })
})
