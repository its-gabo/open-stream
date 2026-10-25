import { afterEach, beforeEach, describe, expect, it } from "bun:test"

import { createUserFactory } from "../../../test/factory/user.factory"
import {
  createApiClient,
  sessionCookieFrom,
  signInAsUser,
} from "../../../test/helpers/api-client"
import { expireSessions } from "../../../test/helpers/auth-records"
import { createTestApp } from "../../../test/helpers/test-app"
import {
  INVALID_SESSION_COOKIES,
  REJECTED_SIGN_INS,
} from "./auth-session.scenarios"

import type { UserCredentials } from "../../../test/factory/user.factory"
import type { TestApp } from "../../../test/helpers/test-app"

describe("Sessions (e2e)", () => {
  let testApp: TestApp
  let user: UserCredentials

  beforeEach(async () => {
    testApp = await createTestApp()
    user = await createUserFactory(testApp).create()
  })

  afterEach(() => testApp.close())

  const signIn = (body: object) =>
    createApiClient(testApp).post("/auth/sign-in/email", body)

  const readSession = async (client = createApiClient(testApp)) =>
    (await (await client.get("/auth/session")).json()).data

  describe("signing in", () => {
    it("issues an HttpOnly, Secure, SameSite=Lax session cookie", async () => {
      const response = await signIn(user)

      expect(response.status).toBe(200)
      expect(response.headers.get("set-cookie")).toMatch(
        /^openstream_session=[a-f0-9]{64};.*Path=\/.*HttpOnly.*Secure.*SameSite=Lax/i
      )
    })

    it("returns only the public user fields", async () => {
      const response = await signIn(user)

      expect((await response.json()).data).toEqual({
        user: {
          id: expect.any(String),
          email: user.email,
          name: user.name,
          emailVerified: true,
        },
      })
    })

    it.each(REJECTED_SIGN_INS)(
      "rejects $description with the same error and no session",
      async ({ body }) => {
        const response = await signIn({ ...user, ...body })

        expect(response.status).toBe(401)
        expect(await response.json()).toEqual({
          code: "auth.sign_in.fail",
          message: expect.any(String),
          reason: "auth.invalid_credentials",
        })
        expect(sessionCookieFrom(response)).toBeUndefined()
      }
    )

    it("rejects an unverified user without a session", async () => {
      const unverifiedUser = await createUserFactory(testApp)
        .unverified()
        .create()

      const response = await signIn(unverifiedUser)

      expect(response.status).toBe(403)
      expect(sessionCookieFrom(response)).toBeUndefined()
    })

    it("replaces the session the browser already had", async () => {
      const previousClient = await signInAsUser(testApp, user)

      const response = await previousClient.post("/auth/sign-in/email", user)
      const nextClient = createApiClient(testApp, sessionCookieFrom(response))

      expect(response.status).toBe(200)
      expect(await readSession(previousClient)).toEqual({
        authenticated: false,
      })
      expect(await readSession(nextClient)).toMatchObject({
        authenticated: true,
      })
    })
  })

  describe("reading the session", () => {
    it("returns the signed-in user", async () => {
      const client = await signInAsUser(testApp, user)

      expect(await readSession(client)).toEqual({
        authenticated: true,
        user: expect.objectContaining({ email: user.email }),
      })
    })

    it.each(INVALID_SESSION_COOKIES)(
      "treats $description as signed out",
      async ({ cookie }) => {
        expect(await readSession(createApiClient(testApp, cookie))).toEqual({
          authenticated: false,
        })
      }
    )

    it("treats an expired session as signed out", async () => {
      const client = await signInAsUser(testApp, user)

      await expireSessions(testApp)

      expect(await readSession(client)).toEqual({ authenticated: false })
    })
  })

  describe("signing out", () => {
    it("revokes the session and clears the cookie", async () => {
      const client = await signInAsUser(testApp, user)

      const response = await client.post("/auth/sign-out")

      expect(response.status).toBe(200)
      expect(response.headers.get("set-cookie")).toMatch(
        /^openstream_session=;.*Max-Age=0/i
      )
      expect(await readSession(client)).toEqual({ authenticated: false })
    })

    it("succeeds without a session", async () => {
      expect(
        (await createApiClient(testApp).post("/auth/sign-out")).status
      ).toBe(200)
    })
  })
})
