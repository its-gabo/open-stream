import { authTokens, sessions } from "../../src/db/schema"

import type { TestApp } from "./test-app"

const PAST = new Date(Date.now() - 60_000)

export const expireSessions = (testApp: TestApp) =>
  testApp.appModule.db.update(sessions).set({ expiresAt: PAST })

export const expireAuthTokens = (testApp: TestApp) =>
  testApp.appModule.db.update(authTokens).set({ expiresAt: PAST })
