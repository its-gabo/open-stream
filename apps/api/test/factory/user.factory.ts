import { randomUUID } from "node:crypto"
import { Factory } from "fishery"

import { TEST_REQUEST_SOURCE } from "../helpers/activity"
import { latestEmailToken } from "../helpers/outbox"

import type { TestApp } from "../helpers/test-app"

export type UserCredentials = {
  name: string
  email: string
  password: string
}

type UserFactoryTransientParams = {
  verified: boolean
}

class UserFactory extends Factory<
  UserCredentials,
  UserFactoryTransientParams,
  UserCredentials
> {
  unverified() {
    return this.transient({ verified: false })
  }
}

/**
 * Registers users through the same services as the sign-up flow and, unless
 * `unverified()`, confirms them with the link from their verification email.
 */
export const createUserFactory = (testApp: TestApp) =>
  UserFactory.define(({ onCreate, sequence, transientParams }) => {
    onCreate(async (user) => {
      await testApp.appModule.authRegistrationService.signUpWithEmail(
        user,
        TEST_REQUEST_SOURCE
      )

      if (transientParams.verified ?? true) {
        await testApp.appModule.authEmailVerificationService.verifyEmail(
          await latestEmailToken(testApp, user.email),
          TEST_REQUEST_SOURCE
        )
      }

      return user
    })

    return {
      name: `User ${sequence}`,
      email: `user-${sequence}-${randomUUID().slice(0, 8)}@example.test`,
      password: "user-test-password",
    }
  })
