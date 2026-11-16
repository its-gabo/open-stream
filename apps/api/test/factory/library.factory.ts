import { Factory } from "fishery"

import { TEST_REQUEST_SOURCE, activityActorOf } from "../helpers/activity"

import type { LibraryDto } from "../../src/libraries/dto/libraries.schemas"
import type { TestApp } from "../helpers/test-app"
import type { UserCredentials } from "./user.factory"

type LibraryFactoryParams = { name: string }

type LibraryFactoryTransientParams = {
  organizationSlug: string
  owner: UserCredentials
}

class LibraryFactory extends Factory<
  LibraryFactoryParams,
  LibraryFactoryTransientParams,
  LibraryDto
> {
  /** The organization the library is created in, by its owner. */
  inOrganization(organizationSlug: string, owner: UserCredentials) {
    return this.transient({ organizationSlug, owner })
  }
}

/** Creates libraries through the same service as the API. */
export const createLibraryFactory = (testApp: TestApp) =>
  LibraryFactory.define(({ onCreate, sequence, transientParams }) => {
    const { authSessionService, organizationsService, librariesService } =
      testApp.appModule

    onCreate(async (library) => {
      const { organizationSlug, owner } = transientParams

      if (!organizationSlug || !owner) {
        throw new Error("Use inOrganization(slug, owner) to create libraries")
      }

      const { session } = await authSessionService.signInWithEmail(
        owner,
        null,
        TEST_REQUEST_SOURCE
      )
      const access = await organizationsService.findAccess(
        session.userId,
        organizationSlug
      )

      return (
        await librariesService.createLibrary(
          access!,
          activityActorOf(session),
          library
        )
      ).library
    })

    return { name: `Library ${sequence}` }
  })
