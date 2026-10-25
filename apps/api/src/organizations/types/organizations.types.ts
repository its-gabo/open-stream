import type {
  ORGANIZATION_INVITATION_STATUSES,
  ORGANIZATION_ROLES,
  ORGANIZATION_STATUSES,
} from "@workspace/shared"
import type { AuthCookieService } from "../../auth/services/auth-cookie.service"
import type { AuthSessionService } from "../../auth/services/auth-session.service"
import type { AuthTokenService } from "../../auth/services/auth-token.service"
import type { AuthenticatedEnv } from "../../auth/types/auth.types"
import type { ValueOf } from "../../common/types/common.types"
import type { AppConfig } from "../../config/app.config"
import type { Database } from "../../db/database.types"
import type { OutboxService } from "../../outbox/services/outbox.service"
import type { ORGANIZATION_DELETION_ACTIONS } from "../constants/organizations.constants"

export type OrganizationRole = ValueOf<typeof ORGANIZATION_ROLES>
export type OrganizationStatus = ValueOf<typeof ORGANIZATION_STATUSES>
export type OrganizationInvitationStatus = ValueOf<
  typeof ORGANIZATION_INVITATION_STATUSES
>
export type OrganizationDeletionAction = ValueOf<
  typeof ORGANIZATION_DELETION_ACTIONS
>

export type OrganizationSummary = {
  id: string
  name: string
  slug: string
  status: OrganizationStatus
  scheduledDeletionAt: Date | null
}

/** The organization of the `:organizationSlug` route param and the caller's membership in it. */
export type OrganizationAccess = {
  organization: OrganizationSummary
  membershipId: string
  role: OrganizationRole
}

/** Hono env for routes behind `requireOrganizationMembership`. */
export type OrganizationEnv = {
  Variables: AuthenticatedEnv["Variables"] & {
    organizationAccess: OrganizationAccess
  }
}

export type OrganizationPerson = {
  email: string
  name: string
}

export type OrganizationModuleDependencies = {
  db: Database
  config: AppConfig
  outboxService: OutboxService
  authTokenService: AuthTokenService
}

export type OrganizationRouterDependencies = {
  authSessionService: AuthSessionService
  authCookieService: AuthCookieService
}
