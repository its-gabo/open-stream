import { randomUUID } from "node:crypto"
import { Factory } from "fishery"

import { TEST_REQUEST_SOURCE, activityActorOf } from "../helpers/activity"

import type { OrganizationCreateBody } from "../../src/organizations/dto/organizations.schemas"
import type { TestApp } from "../helpers/test-app"
import type { UserCredentials } from "./user.factory"

type OrganizationFactoryTransientParams = {
  owner: UserCredentials
  members: UserCredentials[]
}

class OrganizationFactory extends Factory<
  OrganizationCreateBody,
  OrganizationFactoryTransientParams,
  OrganizationCreateBody
> {
  ownedBy(owner: UserCredentials) {
    return this.transient({ owner })
  }

  withMembers(...members: UserCredentials[]) {
    return this.transient({ members })
  }
}

/**
 * Creates organizations through the same services as the API, owned by
 * `ownedBy(owner)`; each of `withMembers(...)` is invited and accepts.
 */
export const createOrganizationFactory = (testApp: TestApp) =>
  OrganizationFactory.define(({ onCreate, sequence, transientParams }) => {
    const {
      authSessionService,
      organizationsService,
      organizationTeamService,
      organizationInvitationsService,
    } = testApp.appModule

    const startSession = async (user: UserCredentials) =>
      (
        await authSessionService.signInWithEmail(
          user,
          null,
          TEST_REQUEST_SOURCE
        )
      ).session

    onCreate(async (organization) => {
      const { owner, members = [] } = transientParams

      if (!owner) throw new Error("Use ownedBy(owner) to create organizations")

      const ownerSession = await startSession(owner)

      await organizationsService.createOrganization(
        ownerSession,
        activityActorOf(ownerSession),
        organization
      )

      const access = await organizationsService.findAccess(
        ownerSession.userId,
        organization.slug
      )

      for (const member of members) {
        const { invitation } = await organizationTeamService.inviteMember(
          access!,
          ownerSession,
          activityActorOf(ownerSession),
          { email: member.email }
        )

        const memberSession = await startSession(member)

        await organizationInvitationsService.acceptInvitation(
          memberSession,
          activityActorOf(memberSession),
          invitation.invitationId
        )
      }

      return organization
    })

    return {
      name: `Organization ${sequence}`,
      slug: `organization-${sequence}-${randomUUID().slice(0, 8)}`,
    }
  })
