import { ACTIVITY_ACTOR_KINDS } from "@workspace/shared"

import type {
  ActivityActor,
  ActivityRequestSource,
} from "../../src/activity/types/activity.types"
import type { AuthUserSession } from "../../src/auth/types/auth.types"

/** The member as a request with their session would record them, for factories that call services directly. */
export const activityActorOf = (session: AuthUserSession): ActivityActor => ({
  kind: ACTIVITY_ACTOR_KINDS.USER,
  userId: session.userId,
  apiKeyId: null,
  label: `${session.name} <${session.email}>`,
  ipAddress: null,
  userAgent: null,
})

/** A request without an address or user agent, for factories that call services directly. */
export const TEST_REQUEST_SOURCE: ActivityRequestSource = {
  ipAddress: null,
  userAgent: null,
}
