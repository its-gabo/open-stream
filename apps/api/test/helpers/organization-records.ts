import { eq } from "drizzle-orm"

import {
  organizationDeletionRequests,
  organizationInvitations,
} from "../../src/db/schema"

import type { TestApp } from "./test-app"

const PAST = new Date(Date.now() - 60_000)

export const expireInvitations = (testApp: TestApp) =>
  testApp.appModule.db.update(organizationInvitations).set({ expiresAt: PAST })

export const endDeletionGracePeriods = (testApp: TestApp) =>
  testApp.appModule.db
    .update(organizationDeletionRequests)
    .set({ scheduledFor: PAST })

export async function findDeletionRequest(
  testApp: TestApp,
  organizationId: string
) {
  const [request] = await testApp.appModule.db
    .select()
    .from(organizationDeletionRequests)
    .where(eq(organizationDeletionRequests.organizationId, organizationId))

  return request ?? null
}
