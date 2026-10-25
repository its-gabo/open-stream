import { afterEach, beforeEach, describe, expect, it } from "bun:test"

import { createUserFactory } from "../../../test/factory/user.factory"
import { createApiClient, signInAsUser } from "../../../test/helpers/api-client"
import { expireAuthTokens } from "../../../test/helpers/auth-records"
import {
  emailActionUrl,
  findPublishedEmails,
  latestEmailToken,
} from "../../../test/helpers/outbox"
import { TEST_WEB_ORIGIN, createTestApp } from "../../../test/helpers/test-app"
import { EMAIL_TEMPLATES } from "../../email/constants/email.constants"
import { REJECTED_RESET_REQUESTS } from "./auth-password-reset.scenarios"

import type { UserCredentials } from "../../../test/factory/user.factory"
import type { TestApp } from "../../../test/helpers/test-app"

const NEW_PASSWORD = "a-brand-new-password"

describe("Password reset (e2e)", () => {
  let testApp: TestApp
  let user: UserCredentials

  beforeEach(async () => {
    testApp = await createTestApp()
    user = await createUserFactory(testApp).create()
  })

  afterEach(() => testApp.close())

  const client = () => createApiClient(testApp)

  const requestReset = (email: string) =>
    client().post("/auth/forgot-password", { email })

  const resetPassword = (token: string, password = NEW_PASSWORD) =>
    client().post("/auth/reset-password", { token, password })

  const requestResetToken = async () => {
    await requestReset(user.email)

    return latestEmailToken(testApp, user.email)
  }

  describe("requesting a reset", () => {
    it("publishes a reset email with a link to the web app", async () => {
      const response = await requestReset(user.email)
      const email = (await findPublishedEmails(testApp, user.email)).at(-1)

      expect(response.status).toBe(200)
      expect(email).toMatchObject({
        template: EMAIL_TEMPLATES.RESET_PASSWORD,
        props: { name: user.name, expiresInMinutes: 30 },
      })
      expect(emailActionUrl(email!).href).toStartWith(
        `${TEST_WEB_ORIGIN}/reset-password?token=`
      )
    })

    it("answers an unknown email exactly like a known one, without sending anything", async () => {
      const emailsBefore = await findPublishedEmails(testApp)

      const known = await (await requestReset(user.email)).json()
      const unknown = await (await requestReset("nobody@example.test")).json()

      expect(unknown).toEqual(known)
      expect(await findPublishedEmails(testApp)).toHaveLength(
        emailsBefore.length + 1
      )
    })
  })

  describe("resetting the password", () => {
    it("replaces the password", async () => {
      const response = await resetPassword(await requestResetToken())

      expect(response.status).toBe(200)
      expect((await client().post("/auth/sign-in/email", user)).status).toBe(
        401
      )
      expect(
        (
          await client().post("/auth/sign-in/email", {
            ...user,
            password: NEW_PASSWORD,
          })
        ).status
      ).toBe(200)
    })

    it("revokes every existing session of the user", async () => {
      const signedIn = await signInAsUser(testApp, user)

      await resetPassword(await requestResetToken())

      const session = await (await signedIn.get("/auth/session")).json()

      expect(session.data).toEqual({ authenticated: false })
    })

    it("accepts each link only once", async () => {
      const token = await requestResetToken()

      await resetPassword(token)
      const replay = await resetPassword(token, "yet-another-password")

      expect(replay.status).toBe(422)
      expect(await replay.json()).toMatchObject({
        code: "auth.reset_password.fail",
      })
    })

    it("invalidates the user's other outstanding reset links", async () => {
      const firstToken = await requestResetToken()
      const secondToken = await requestResetToken()

      await resetPassword(secondToken)

      expect((await resetPassword(firstToken)).status).toBe(422)
    })

    it("rejects an expired link", async () => {
      const token = await requestResetToken()

      await expireAuthTokens(testApp)

      expect((await resetPassword(token)).status).toBe(422)
    })

    it("does not accept an email verification link", async () => {
      const unverifiedUser = await createUserFactory(testApp)
        .unverified()
        .create()
      const verificationToken = await latestEmailToken(
        testApp,
        unverifiedUser.email
      )

      expect((await resetPassword(verificationToken)).status).toBe(422)
    })

    it.each(REJECTED_RESET_REQUESTS)(
      "rejects $description",
      async ({ body }) => {
        const response = await client().post("/auth/reset-password", body)

        expect(response.status).toBe(422)
        expect(await response.json()).toMatchObject({ code: "validation.fail" })
      }
    )
  })
})
