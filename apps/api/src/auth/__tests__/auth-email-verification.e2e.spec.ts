import { afterEach, beforeEach, describe, expect, it } from "bun:test"

import { createUserFactory } from "../../../test/factory/user.factory"
import { createApiClient } from "../../../test/helpers/api-client"
import { expireAuthTokens } from "../../../test/helpers/auth-records"
import { latestEmailToken } from "../../../test/helpers/outbox"
import { createTestApp } from "../../../test/helpers/test-app"

import type { UserCredentials } from "../../../test/factory/user.factory"
import type { TestApp } from "../../../test/helpers/test-app"

describe("Email verification (e2e)", () => {
  let testApp: TestApp
  let user: UserCredentials
  let token: string

  beforeEach(async () => {
    testApp = await createTestApp()
    user = await createUserFactory(testApp).unverified().create()
    token = await latestEmailToken(testApp, user.email)
  })

  afterEach(() => testApp.close())

  const verifyEmail = (verificationToken: string) =>
    createApiClient(testApp).get(
      `/auth/verify-email?token=${encodeURIComponent(verificationToken)}`
    )

  const signIn = () =>
    createApiClient(testApp).post("/auth/sign-in/email", user)

  it("verifies the email so the user can sign in", async () => {
    const response = await verifyEmail(token)

    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({
      code: "auth.verify_email.success",
    })
    expect((await signIn()).status).toBe(200)
  })

  it("accepts each link only once", async () => {
    await verifyEmail(token)

    const replay = await verifyEmail(token)

    expect(replay.status).toBe(422)
    expect(await replay.json()).toMatchObject({
      code: "auth.verify_email.fail",
    })
  })

  it("rejects an expired link and keeps the user unverified", async () => {
    await expireAuthTokens(testApp)

    expect((await verifyEmail(token)).status).toBe(422)
    expect((await signIn()).status).toBe(403)
  })

  it("does not accept a password reset link", async () => {
    await createApiClient(testApp).post("/auth/forgot-password", {
      email: user.email,
    })
    const resetToken = await latestEmailToken(testApp, user.email)

    expect((await verifyEmail(resetToken)).status).toBe(422)
    expect((await signIn()).status).toBe(403)
  })

  it("rejects a malformed token", async () => {
    const response = await verifyEmail("not-a-token")

    expect(response.status).toBe(422)
    expect(await response.json()).toMatchObject({ code: "validation.fail" })
  })
})
