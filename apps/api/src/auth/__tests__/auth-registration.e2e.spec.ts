import { afterEach, beforeEach, describe, expect, it } from "bun:test"

import { createUserFactory } from "../../../test/factory/user.factory"
import { createApiClient } from "../../../test/helpers/api-client"
import {
  emailActionUrl,
  findPublishedEmails,
} from "../../../test/helpers/outbox"
import { TEST_WEB_ORIGIN, createTestApp } from "../../../test/helpers/test-app"
import { HTTP_ERROR_RESPONSES } from "../../common/http/errors/http-error.constants"
import { EMAIL_TEMPLATES } from "../../email/constants/email.constants"
import { REJECTED_SIGN_UPS, VALID_SIGN_UP } from "./auth-registration.scenarios"

import type { TestApp } from "../../../test/helpers/test-app"

describe("Registration (e2e)", () => {
  let testApp: TestApp

  beforeEach(async () => {
    testApp = await createTestApp()
  })

  afterEach(() => testApp.close())

  const signUp = (body: unknown) =>
    createApiClient(testApp).post("/auth/sign-up/email", body)

  it("creates the account and publishes a verification email", async () => {
    const response = await signUp({ ...VALID_SIGN_UP, redirectTo: "/videos" })

    expect(response.status).toBe(201)
    expect(await response.json()).toEqual({
      code: "auth.sign_up.success",
      message: expect.any(String),
      data: {},
    })

    const [email] = await findPublishedEmails(testApp)
    const verificationUrl = emailActionUrl(email!)

    expect(email).toMatchObject({
      recipient: VALID_SIGN_UP.email,
      template: EMAIL_TEMPLATES.WELCOME_VERIFY,
      props: { name: VALID_SIGN_UP.name, expiresInHours: 24 },
    })
    expect(verificationUrl.origin).toBe(TEST_WEB_ORIGIN)
    expect(verificationUrl.pathname).toBe("/verify-email")
    expect(verificationUrl.searchParams.get("token")).toMatch(/^[a-f0-9]{64}$/)
    expect(verificationUrl.searchParams.get("redirectTo")).toBe("/videos")
  })

  it("normalizes the email before storing it", async () => {
    await signUp({ ...VALID_SIGN_UP, email: "  Ada@Example.TEST " })

    const [email] = await findPublishedEmails(testApp)

    expect(email?.recipient).toBe("ada@example.test")
  })

  it("leaves new accounts unable to sign in until the email is verified", async () => {
    await signUp(VALID_SIGN_UP)

    const response = await createApiClient(testApp).post(
      "/auth/sign-in/email",
      VALID_SIGN_UP
    )

    expect(response.status).toBe(403)
    expect(await response.json()).toMatchObject({
      code: "auth.sign_in.email_not_verified",
    })
  })

  it("rejects a taken email without publishing another email", async () => {
    const user = await createUserFactory(testApp).create()
    const emailsBefore = await findPublishedEmails(testApp)

    const response = await signUp({ ...VALID_SIGN_UP, email: user.email })

    expect(response.status).toBe(409)
    expect(await response.json()).toEqual({
      code: "auth.sign_up.fail",
      message: expect.any(String),
      reason: "auth.user_exists",
    })
    expect(await findPublishedEmails(testApp)).toEqual(emailsBefore)
  })

  it("rejects a request without a JSON body in the unified error format", async () => {
    const response = await signUp(undefined)

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual(HTTP_ERROR_RESPONSES.REQUEST_FAILED)
    expect(await findPublishedEmails(testApp)).toEqual([])
  })

  it.each(REJECTED_SIGN_UPS)("rejects $description", async ({ body }) => {
    const response = await signUp(body)

    expect(response.status).toBe(422)
    expect(await response.json()).toMatchObject({ code: "validation.fail" })
    expect(await findPublishedEmails(testApp)).toEqual([])
  })
})
