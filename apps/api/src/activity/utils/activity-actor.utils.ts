import { ACTIVITY_ACTOR_KINDS, ACTIVITY_LIMITS } from "@workspace/shared"
import type { HonoRequest } from "hono"
import type { AuthUserSession } from "../../auth/types/auth.types"
import type { LibraryApiKeyRecord } from "../../db/schema"
import { SYSTEM_ACTIVITY_LABEL } from "../constants/activity.constants"
import type {
  ActivityActor,
  ActivityRequestSource,
} from "../types/activity.types"

/**
 * The client address as the reverse proxy reports it: the first entry of
 * `X-Forwarded-For`. The API is meant to be reached only through the proxy,
 * which replaces that header for untrusted clients.
 */
export const readActivityRequestSource = (
  request: HonoRequest
): ActivityRequestSource => ({
  ipAddress: request.header("x-forwarded-for")?.split(",")[0]?.trim() || null,
  userAgent:
    request
      .header("user-agent")
      ?.slice(0, ACTIVITY_LIMITS.USER_AGENT_MAX_LENGTH) ?? null,
})

/** A member, e.g. the one behind a session request or the one who just signed in. */
export const activityActorOfUser = (
  user: Pick<AuthUserSession, "userId" | "name" | "email">,
  source: ActivityRequestSource
): ActivityActor => ({
  kind: ACTIVITY_ACTOR_KINDS.USER,
  userId: user.userId,
  apiKeyId: null,
  label: `${user.name} <${user.email}>`,
  ...source,
})

/** The library API key behind a library API request. */
export const activityActorOfApiKey = (
  apiKey: LibraryApiKeyRecord,
  source: ActivityRequestSource
): ActivityActor => ({
  kind: ACTIVITY_ACTOR_KINDS.API_KEY,
  userId: null,
  apiKeyId: apiKey.id,
  label: apiKey.name,
  ...source,
})

/** Someone who is not signed in, named by what they claimed, e.g. the email of a failed sign-in. */
export const anonymousActivityActor = (
  label: string,
  source: ActivityRequestSource
): ActivityActor => ({
  kind: ACTIVITY_ACTOR_KINDS.ANONYMOUS,
  userId: null,
  apiKeyId: null,
  label,
  ...source,
})

/** OpenStream itself, e.g. the worker deleting an organization whose grace period ended. */
export const SYSTEM_ACTIVITY_ACTOR: ActivityActor = {
  kind: ACTIVITY_ACTOR_KINDS.SYSTEM,
  userId: null,
  apiKeyId: null,
  label: SYSTEM_ACTIVITY_LABEL,
  ipAddress: null,
  userAgent: null,
}
