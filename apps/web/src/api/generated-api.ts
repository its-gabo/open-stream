/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

export interface AcceptOrganizationInvitationParams {
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  invitationId: string
}

export type ActivityAction =
  | "account.signed_up"
  | "account.email_verified"
  | "account.signed_in"
  | "account.sign_in_failed"
  | "account.signed_out"
  | "account.password_reset_requested"
  | "account.password_reset"
  | "organization.created"
  | "organization.updated"
  | "organization.deletion_scheduled"
  | "organization.deletion_canceled"
  | "organization.deleted"
  | "organization.ownership_transferred"
  | "invitation.created"
  | "invitation.resent"
  | "invitation.canceled"
  | "invitation.accepted"
  | "invitation.declined"
  | "membership.removed"
  | "membership.left"
  | "storage.created"
  | "storage.updated"
  | "storage.deleted"
  | "library.created"
  | "library.updated"
  | "library.storage_changed"
  | "library.encoding_updated"
  | "library.security_updated"
  | "api_key.created"
  | "api_key.updated"
  | "api_key.rolled"
  | "api_key.deleted"
  | "webhook.created"
  | "webhook.updated"
  | "webhook.deleted"
  | "webhook.secret_rolled"
  | "webhook.test_sent"
  | "webhook.delivery_resent"
  | "video.created"
  | "video.updated"
  | "video.deleted"
  | "video.uploaded"
  | "video.upload_canceled"
  | "video.reprocess_requested"

export type ActivityActorKind = "user" | "api_key" | "anonymous" | "system"

export interface ActivityLog {
  action: ActivityAction
  actor: {
    apiKeyId: string | null
    kind: ActivityActorKind
    label: string
    userId: string | null
  }
  after: Partial<Record<string, any>> | null
  before: Partial<Record<string, any>> | null
  context: Partial<Record<string, any>>
  /**
   * @format date-time
   * @pattern ^(?:(?:\d\d[2468][048]|\d\d[13579][26]|\d\d0[48]|[02468][048]00|[13579][26]00)-02-29|\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\d|30)|(?:02)-(?:0[1-9]|1\d|2[0-8])))T(?:(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d+)?(?:Z))$
   */
  createdAt: string
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  id: string
  ipAddress: string | null
  resource: {
    id: string | null
    label: string | null
    type: ActivityResourceType
  }
  userAgent: string | null
}

export interface ActivityLogPageSuccessResponse {
  code: string
  data: {
    activities: ActivityLog[]
    pagination: Pagination
  }
  message: string
}

export type ActivityResourceType =
  | "account"
  | "organization"
  | "invitation"
  | "membership"
  | "storage"
  | "library"
  | "api_key"
  | "webhook"
  | "video"

export interface AnalyticsDay {
  /**
   * @format date
   * @pattern ^(?:(?:\d\d[2468][048]|\d\d[13579][26]|\d\d0[48]|[02468][048]00|[13579][26]00)-02-29|\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\d|30)|(?:02)-(?:0[1-9]|1\d|2[0-8])))$
   */
  date: string
  /**
   * @min 0
   * @max 9007199254740991
   */
  views: number
  /** @min 0 */
  watchSeconds: number
}

export interface AnalyticsDevice {
  deviceType: ViewerDeviceType
  /**
   * @min 0
   * @max 9007199254740991
   */
  views: number
}

export interface AnalyticsEmbeddingHost {
  host: string
  /**
   * @min 0
   * @max 9007199254740991
   */
  views: number
}

export interface AnalyticsPeriod {
  /**
   * @exclusiveMin 0
   * @max 9007199254740991
   */
  days: number
  /**
   * @format date-time
   * @pattern ^(?:(?:\d\d[2468][048]|\d\d[13579][26]|\d\d0[48]|[02468][048]00|[13579][26]00)-02-29|\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\d|30)|(?:02)-(?:0[1-9]|1\d|2[0-8])))T(?:(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d+)?(?:Z))$
   */
  from: string
  /**
   * @format date-time
   * @pattern ^(?:(?:\d\d[2468][048]|\d\d[13579][26]|\d\d0[48]|[02468][048]00|[13579][26]00)-02-29|\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\d|30)|(?:02)-(?:0[1-9]|1\d|2[0-8])))T(?:(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d+)?(?:Z))$
   */
  to: string
}

export interface AnalyticsTopLibrary {
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  libraryId: string
  name: string
  /**
   * @min 0
   * @max 9007199254740991
   */
  views: number
  /** @min 0 */
  watchSeconds: number
}

export interface AnalyticsTopVideo {
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  libraryId: string
  libraryName: string
  title: string
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  videoId: string
  /**
   * @min 0
   * @max 9007199254740991
   */
  views: number
  /** @min 0 */
  watchSeconds: number
}

export interface AnalyticsTotals {
  /**
   * @min 0
   * @max 1
   */
  averageCompletion: number
  /** @min 0 */
  averageViewSeconds: number
  /**
   * @min 0
   * @max 9007199254740991
   */
  views: number
  /** @min 0 */
  watchSeconds: number
}

export type ApiEmptyData = object

export interface ApiErrorResponse {
  code: string
  message: string
  reason: string
}

export interface AuthEmptySuccessResponse {
  code: string
  data: ApiEmptyData
  message: string
}

export interface AuthForgotPasswordBody {
  email: string
}

export interface AuthResetPasswordBody {
  /**
   * @minLength 8
   * @maxLength 128
   */
  password: string
  /** @pattern ^[a-f0-9]{64}$ */
  token: string
}

export type AuthSession =
  | {
      authenticated: false
    }
  | {
      authenticated: true
      user: AuthUser
    }

export interface AuthSessionSuccessResponse {
  code: string
  data: AuthSession
  message: string
}

export interface AuthSignInBody {
  email: string
  /**
   * @minLength 1
   * @maxLength 128
   */
  password: string
}

export interface AuthSignInSuccessResponse {
  code: string
  data: {
    user: AuthUser
  }
  message: string
}

export interface AuthSignUpBody {
  email: string
  /**
   * @minLength 1
   * @maxLength 100
   */
  name: string
  /**
   * @minLength 8
   * @maxLength 128
   */
  password: string
  /** @maxLength 2048 */
  redirectTo?: string
}

export interface AuthUser {
  /**
   * @format email
   * @pattern ^(?:[A-Za-z0-9_'+\-]+\.)*[A-Za-z0-9_'+\-]*[A-Za-z0-9_+-]@(?:[A-Za-z0-9][A-Za-z0-9\-]*\.)+[A-Za-z]{2,}$
   */
  email: string
  emailVerified: boolean
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  id: string
  name: string
}

export interface CancelOrganizationDeletionParams {
  organizationSlug: string
}

export interface CancelOrganizationInvitationParams {
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  invitationId: string
  organizationSlug: string
}

export interface CreateLibraryApiKeyParams {
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  libraryId: string
  organizationSlug: string
}

export interface CreateLibraryApiPlaybackUrlParams {
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  libraryId: string
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  videoId: string
}

export interface CreateLibraryApiVideoParams {
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  libraryId: string
}

export interface CreateLibraryParams {
  organizationSlug: string
}

export interface CreateStorageParams {
  organizationSlug: string
}

export interface CreateVideoParams {
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  libraryId: string
  organizationSlug: string
}

export interface DeclineOrganizationInvitationParams {
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  invitationId: string
}

export interface DeleteLibraryApiKeyParams {
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  apiKeyId: string
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  libraryId: string
  organizationSlug: string
}

export interface DeleteLibraryApiVideoParams {
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  libraryId: string
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  videoId: string
}

export interface DeleteLibraryWebhookParams {
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  libraryId: string
  organizationSlug: string
}

export interface DeleteStorageParams {
  organizationSlug: string
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  storageId: string
}

export interface DeleteVideoParams {
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  libraryId: string
  organizationSlug: string
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  videoId: string
}

export interface GetLibraryAnalyticsParams {
  /** @default 30 */
  days?: number
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  libraryId: string
  organizationSlug: string
}

export interface GetLibraryApiAccessParams {
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  libraryId: string
  organizationSlug: string
}

export interface GetLibraryApiAnalyticsParams {
  /** @default 30 */
  days?: number
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  libraryId: string
}

export interface GetLibraryApiVideoAnalyticsParams {
  /** @default 30 */
  days?: number
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  libraryId: string
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  videoId: string
}

export interface GetLibraryApiVideoEmbedParams {
  expires?: string
  key?: string
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  libraryId: string
  token?: string
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  videoId: string
}

export interface GetLibraryApiVideoParams {
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  libraryId: string
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  videoId: string
}

export interface GetLibraryApiVideoStatusParams {
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  libraryId: string
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  videoId: string
}

export interface GetLibraryEncodingParams {
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  libraryId: string
  organizationSlug: string
}

export interface GetLibraryParams {
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  libraryId: string
  organizationSlug: string
}

export interface GetLibraryStorageParams {
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  libraryId: string
  organizationSlug: string
}

export interface GetLibraryWebhookParams {
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  libraryId: string
  organizationSlug: string
}

export interface GetOrganizationAnalyticsParams {
  /** @default 30 */
  days?: number
  organizationSlug: string
}

export interface GetOrganizationParams {
  organizationSlug: string
}

export interface GetOrganizationTeamParams {
  organizationSlug: string
}

export interface GetStorageParams {
  organizationSlug: string
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  storageId: string
}

export interface GetVideoAnalyticsParams {
  /** @default 30 */
  days?: number
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  libraryId: string
  organizationSlug: string
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  videoId: string
}

export interface GetVideoHlsFileParams {
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  libraryId: string
  organizationSlug: string
  /** @maxLength 64 */
  path: string
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  videoId: string
}

export interface GetVideoParams {
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  libraryId: string
  organizationSlug: string
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  videoId: string
}

export interface GetVideoPosterParams {
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  libraryId: string
  organizationSlug: string
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  videoId: string
}

export interface GetVideoThumbnailParams {
  /** @maxLength 32 */
  fileName: string
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  libraryId: string
  organizationSlug: string
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  videoId: string
}

export interface InviteOrganizationMemberParams {
  organizationSlug: string
}

export interface LeaveOrganizationParams {
  organizationSlug: string
}

export interface Library {
  /**
   * @format date-time
   * @pattern ^(?:(?:\d\d[2468][048]|\d\d[13579][26]|\d\d0[48]|[02468][048]00|[13579][26]00)-02-29|\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\d|30)|(?:02)-(?:0[1-9]|1\d|2[0-8])))T(?:(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d+)?(?:Z))$
   */
  createdAt: string
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  id: string
  isStorageLocked: boolean
  name: string
  storageKind: LibraryStorageKind
  storageName: string | null
  /**
   * @format date-time
   * @pattern ^(?:(?:\d\d[2468][048]|\d\d[13579][26]|\d\d0[48]|[02468][048]00|[13579][26]00)-02-29|\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\d|30)|(?:02)-(?:0[1-9]|1\d|2[0-8])))T(?:(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d+)?(?:Z))$
   */
  updatedAt: string
  /**
   * @min 0
   * @max 9007199254740991
   */
  videoCount: number
}

export interface LibraryAnalytics {
  daily: AnalyticsDay[]
  devices: AnalyticsDevice[]
  embeddingHosts: AnalyticsEmbeddingHost[]
  period: AnalyticsPeriod
  topVideos: AnalyticsTopVideo[]
  totals: AnalyticsTotals
}

export interface LibraryAnalyticsSuccessResponse {
  code: string
  data: {
    analytics: LibraryAnalytics
  }
  message: string
}

export interface LibraryApiAccess {
  apiKeys: LibraryApiKey[]
  /** @format uri */
  apiUrl: string
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  libraryId: string
  security: LibrarySecuritySettings
}

export interface LibraryApiAccessSuccessResponse {
  code: string
  data: {
    apiAccess: LibraryApiAccess
  }
  message: string
}

export interface LibraryApiKey {
  /**
   * @format date-time
   * @pattern ^(?:(?:\d\d[2468][048]|\d\d[13579][26]|\d\d0[48]|[02468][048]00|[13579][26]00)-02-29|\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\d|30)|(?:02)-(?:0[1-9]|1\d|2[0-8])))T(?:(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d+)?(?:Z))$
   */
  createdAt: string
  hint: string
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  id: string
  lastUsedAt: string | null
  name: string
  scopes: LibraryApiKeyScope[]
}

export interface LibraryApiKeyCreateBody {
  /**
   * @minLength 1
   * @maxLength 80
   */
  name: string
  /** @minItems 1 */
  scopes: (
    | "videos:read"
    | "videos:upload"
    | "videos:manage"
    | "playback:sign"
    | "analytics:read"
  )[]
}

export type LibraryApiKeyScope =
  | "videos:read"
  | "videos:upload"
  | "videos:manage"
  | "playback:sign"
  | "analytics:read"

export interface LibraryApiKeySecretSuccessResponse {
  code: string
  data: {
    apiKey: LibraryApiKey
    secret: string
  }
  message: string
}

export interface LibraryApiKeySuccessResponse {
  code: string
  data: {
    apiKey: LibraryApiKey
  }
  message: string
}

export interface LibraryApiKeyUpdateBody {
  /**
   * @minLength 1
   * @maxLength 80
   */
  name?: string
  /** @minItems 1 */
  scopes?: (
    | "videos:read"
    | "videos:upload"
    | "videos:manage"
    | "playback:sign"
    | "analytics:read"
  )[]
}

export interface LibraryCreateBody {
  /**
   * @minLength 1
   * @maxLength 120
   */
  name: string
}

export interface LibraryEmptySuccessResponse {
  code: string
  data: ApiEmptyData
  message: string
}

export interface LibraryEncodingSettings {
  transcodeQualities: VideoQuality[]
}

export interface LibraryEncodingSuccessResponse {
  code: string
  data: {
    encoding: LibraryEncodingSettings
  }
  message: string
}

export interface LibraryEncodingUpdateBody {
  /** @minItems 1 */
  transcodeQualities: ("360p" | "480p" | "720p" | "1080p")[]
}

export interface LibraryListSuccessResponse {
  code: string
  data: {
    libraries: Library[]
    pagination: Pagination
  }
  message: string
}

export interface LibrarySecuritySettings {
  allowedPlaybackHosts: string[]
  requireSignedPlayback: boolean
}

export interface LibrarySecurityUpdateBody {
  /** @maxItems 50 */
  allowedPlaybackHosts: string[]
  requireSignedPlayback: boolean
}

export type LibraryStorageKind = "default" | "custom"

export interface LibraryStorageSettings {
  custom: Storage | null
  defaultPathTemplate: string
  isLocked: boolean
  kind: LibraryStorageKind
}

export interface LibraryStorageSuccessResponse {
  code: string
  data: {
    storage: LibraryStorageSettings
  }
  message: string
}

export interface LibraryStorageUpdateBody {
  storageId: string | null
}

export interface LibrarySuccessResponse {
  code: string
  data: {
    library: Library
  }
  message: string
}

export interface LibraryUpdateBody {
  /**
   * @minLength 1
   * @maxLength 120
   */
  name: string
}

export interface LibraryWebhook {
  /**
   * @format date-time
   * @pattern ^(?:(?:\d\d[2468][048]|\d\d[13579][26]|\d\d0[48]|[02468][048]00|[13579][26]00)-02-29|\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\d|30)|(?:02)-(?:0[1-9]|1\d|2[0-8])))T(?:(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d+)?(?:Z))$
   */
  createdAt: string
  signingSecretHint: string
  /**
   * @format date-time
   * @pattern ^(?:(?:\d\d[2468][048]|\d\d[13579][26]|\d\d0[48]|[02468][048]00|[13579][26]00)-02-29|\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\d|30)|(?:02)-(?:0[1-9]|1\d|2[0-8])))T(?:(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d+)?(?:Z))$
   */
  updatedAt: string
  /** @format uri */
  url: string
}

export interface LibraryWebhookSaveBody {
  /** @maxLength 2048 */
  url: string
}

export interface LibraryWebhookSecretSuccessResponse {
  code: string
  data: {
    signingSecret: string | null
    webhook: LibraryWebhook
  }
  message: string
}

export interface LibraryWebhookSuccessResponse {
  code: string
  data: {
    webhook: LibraryWebhook | null
  }
  message: string
}

export interface ListAccountActivityParams {
  /**
   * @min 1
   * @max 9007199254740991
   * @default 1
   */
  page?: number
  /**
   * @min 1
   * @max 100
   * @default 20
   */
  pageSize?: number
  /** @maxLength 100 */
  search?: string
}

export interface ListLibrariesParams {
  organizationSlug: string
  /**
   * @min 1
   * @max 9007199254740991
   * @default 1
   */
  page?: number
  /**
   * @min 1
   * @max 100
   * @default 20
   */
  pageSize?: number
  /** @maxLength 100 */
  search?: string
}

export interface ListLibraryApiVideosParams {
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  libraryId: string
  /**
   * @min 1
   * @max 9007199254740991
   * @default 1
   */
  page?: number
  /**
   * @min 1
   * @max 100
   * @default 20
   */
  pageSize?: number
  /** @maxLength 100 */
  search?: string
}

export interface ListLibraryWebhookDeliveriesParams {
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  libraryId: string
  organizationSlug: string
  /**
   * @min 1
   * @max 9007199254740991
   * @default 1
   */
  page?: number
  /**
   * @min 1
   * @max 100
   * @default 20
   */
  pageSize?: number
  status?: WebhookDeliveryStatus
}

export interface ListOrganizationActivityParams {
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  actorUserId?: string
  organizationSlug: string
  /**
   * @min 1
   * @max 9007199254740991
   * @default 1
   */
  page?: number
  /**
   * @min 1
   * @max 100
   * @default 20
   */
  pageSize?: number
  /** @maxLength 64 */
  resourceId?: string
  resourceType?: ActivityResourceType
  /** @maxLength 100 */
  search?: string
}

export interface ListStoragesParams {
  organizationSlug: string
  /**
   * @min 1
   * @max 9007199254740991
   * @default 1
   */
  page?: number
  /**
   * @min 1
   * @max 100
   * @default 20
   */
  pageSize?: number
  /** @maxLength 100 */
  search?: string
}

export interface ListVideosParams {
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  libraryId: string
  organizationSlug: string
}

export interface OrganizationAnalytics {
  daily: AnalyticsDay[]
  devices: AnalyticsDevice[]
  embeddingHosts: AnalyticsEmbeddingHost[]
  period: AnalyticsPeriod
  topLibraries: AnalyticsTopLibrary[]
  topVideos: AnalyticsTopVideo[]
  totals: AnalyticsTotals
}

export interface OrganizationAnalyticsSuccessResponse {
  code: string
  data: {
    analytics: OrganizationAnalytics
  }
  message: string
}

export interface OrganizationContext {
  membershipLimit: {
    /**
     * @exclusiveMin 0
     * @max 9007199254740991
     */
    maximum: number
    reached: boolean
    /**
     * @min 0
     * @max 9007199254740991
     */
    used: number
  }
  memberships: {
    /**
     * @format uuid
     * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
     */
    membershipId: string
    organization: OrganizationSummary
    role: OrganizationRole
  }[]
  pendingInvitations: {
    /**
     * @format date-time
     * @pattern ^(?:(?:\d\d[2468][048]|\d\d[13579][26]|\d\d0[48]|[02468][048]00|[13579][26]00)-02-29|\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\d|30)|(?:02)-(?:0[1-9]|1\d|2[0-8])))T(?:(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d+)?(?:Z))$
     */
    expiresAt: string
    /**
     * @format uuid
     * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
     */
    invitationId: string
    organization: OrganizationSummary
  }[]
}

export interface OrganizationContextSuccessResponse {
  code: string
  data: OrganizationContext
  message: string
}

export interface OrganizationCreateBody {
  /**
   * @minLength 1
   * @maxLength 120
   */
  name: string
  slug: string
}

export interface OrganizationCreateSuccessResponse {
  code: string
  data: {
    membership: OrganizationMembership
    organization: OrganizationSummary
  }
  message: string
}

export interface OrganizationDeletionActionBody {
  /** @pattern ^[a-f0-9]{64}$ */
  token: string
}

export interface OrganizationDeletionScheduleBody {
  /** @maxLength 100 */
  confirmationPhrase: string
  /** @maxLength 120 */
  organizationName: string
}

export interface OrganizationDetail {
  /**
   * @format date-time
   * @pattern ^(?:(?:\d\d[2468][048]|\d\d[13579][26]|\d\d0[48]|[02468][048]00|[13579][26]00)-02-29|\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\d|30)|(?:02)-(?:0[1-9]|1\d|2[0-8])))T(?:(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d+)?(?:Z))$
   */
  createdAt: string
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  id: string
  name: string
  scheduledDeletionAt: string | null
  slug: string
  status: OrganizationStatus
  /**
   * @format date-time
   * @pattern ^(?:(?:\d\d[2468][048]|\d\d[13579][26]|\d\d0[48]|[02468][048]00|[13579][26]00)-02-29|\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\d|30)|(?:02)-(?:0[1-9]|1\d|2[0-8])))T(?:(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d+)?(?:Z))$
   */
  updatedAt: string
}

export interface OrganizationEmptySuccessResponse {
  code: string
  data: ApiEmptyData
  message: string
}

export interface OrganizationGetSuccessResponse {
  code: string
  data: {
    membership: OrganizationMembership
    organization: OrganizationDetail
  }
  message: string
}

export interface OrganizationInvitationCreateBody {
  email: string
}

export interface OrganizationInvitationSuccessResponse {
  code: string
  data: {
    invitation: OrganizationTeamInvitation
  }
  message: string
}

export interface OrganizationMembership {
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  membershipId: string
  role: OrganizationRole
}

export interface OrganizationOwnershipTransferBody {
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  membershipId: string
  /** @maxLength 120 */
  organizationName: string
}

export type OrganizationRole = "owner" | "member"

export interface OrganizationSlugSuggestionSuccessResponse {
  code: string
  data: {
    slug: string
  }
  message: string
}

export type OrganizationStatus = "active" | "pending_deletion"

export interface OrganizationSummary {
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  id: string
  name: string
  scheduledDeletionAt: string | null
  slug: string
  status: OrganizationStatus
}

export interface OrganizationSummarySuccessResponse {
  code: string
  data: {
    organization: OrganizationSummary
  }
  message: string
}

export interface OrganizationTeam {
  invitations: OrganizationTeamInvitation[]
  members: OrganizationTeamMember[]
}

export interface OrganizationTeamInvitation {
  /**
   * @format date-time
   * @pattern ^(?:(?:\d\d[2468][048]|\d\d[13579][26]|\d\d0[48]|[02468][048]00|[13579][26]00)-02-29|\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\d|30)|(?:02)-(?:0[1-9]|1\d|2[0-8])))T(?:(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d+)?(?:Z))$
   */
  createdAt: string
  /**
   * @format email
   * @pattern ^(?:[A-Za-z0-9_'+\-]+\.)*[A-Za-z0-9_'+\-]*[A-Za-z0-9_+-]@(?:[A-Za-z0-9][A-Za-z0-9\-]*\.)+[A-Za-z]{2,}$
   */
  email: string
  /**
   * @format date-time
   * @pattern ^(?:(?:\d\d[2468][048]|\d\d[13579][26]|\d\d0[48]|[02468][048]00|[13579][26]00)-02-29|\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\d|30)|(?:02)-(?:0[1-9]|1\d|2[0-8])))T(?:(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d+)?(?:Z))$
   */
  expiresAt: string
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  invitationId: string
  status: OrganizationTeamInvitationStatus
}

export type OrganizationTeamInvitationStatus = "pending" | "expired"

export interface OrganizationTeamMember {
  /**
   * @format email
   * @pattern ^(?:[A-Za-z0-9_'+\-]+\.)*[A-Za-z0-9_'+\-]*[A-Za-z0-9_+-]@(?:[A-Za-z0-9][A-Za-z0-9\-]*\.)+[A-Za-z]{2,}$
   */
  email: string
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  membershipId: string
  name: string
  role: OrganizationRole
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  userId: string
}

export interface OrganizationTeamSuccessResponse {
  code: string
  data: OrganizationTeam
  message: string
}

export interface OrganizationUpdateBody {
  /**
   * @minLength 1
   * @maxLength 120
   */
  name?: string
  slug?: string
}

export interface Pagination {
  /**
   * @min 1
   * @max 9007199254740991
   */
  page: number
  /**
   * @min 1
   * @max 9007199254740991
   */
  pageSize: number
  /**
   * @min 0
   * @max 9007199254740991
   */
  totalItems: number
  /**
   * @min 0
   * @max 9007199254740991
   */
  totalPages: number
}

export interface PlaybackUrl {
  /** @format uri */
  embedUrl: string
  /**
   * @format date-time
   * @pattern ^(?:(?:\d\d[2468][048]|\d\d[13579][26]|\d\d0[48]|[02468][048]00|[13579][26]00)-02-29|\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\d|30)|(?:02)-(?:0[1-9]|1\d|2[0-8])))T(?:(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d+)?(?:Z))$
   */
  expiresAt: string
  /** @format uri */
  hlsUrl: string
  /** @format uri */
  originalUrl: string
  /** @format uri */
  posterUrl: string
  /** @format uri */
  storyboardUrl: string
}

export interface PlaybackUrlCreateBody {
  /**
   * @min 60
   * @max 604800
   * @default 3600
   */
  expiresInSeconds?: number
}

export interface PlaybackUrlSuccessResponse {
  code: string
  data: {
    playback: PlaybackUrl
  }
  message: string
}

export interface ReadLibraryApiVideoHlsFileParams {
  expires?: string
  key?: string
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  libraryId: string
  /** @maxLength 64 */
  path: string
  token?: string
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  videoId: string
}

export interface ReadLibraryApiVideoThumbnailParams {
  expires?: string
  /** @maxLength 32 */
  fileName: string
  key?: string
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  libraryId: string
  token?: string
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  videoId: string
}

export interface RemoveOrganizationMemberParams {
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  membershipId: string
  organizationSlug: string
}

export interface ReportVideoViewProgressParams {
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  libraryId: string
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  videoId: string
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  viewId: string
}

export interface ReprocessLibraryApiVideoParams {
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  libraryId: string
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  videoId: string
}

export interface ReprocessVideoParams {
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  libraryId: string
  organizationSlug: string
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  videoId: string
}

export interface ResendLibraryWebhookDeliveryParams {
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  deliveryId: string
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  libraryId: string
  organizationSlug: string
}

export interface ResendOrganizationInvitationParams {
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  invitationId: string
  organizationSlug: string
}

export interface RetentionPoint {
  /**
   * @min 0
   * @max 100
   */
  percent: number
  /**
   * @min 0
   * @max 9007199254740991
   */
  views: number
}

export interface RollLibraryApiKeyParams {
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  apiKeyId: string
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  libraryId: string
  organizationSlug: string
}

export interface RollLibraryWebhookSecretParams {
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  libraryId: string
  organizationSlug: string
}

export interface SaveLibraryWebhookParams {
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  libraryId: string
  organizationSlug: string
}

export interface ScheduleOrganizationDeletionParams {
  organizationSlug: string
}

export interface SelectOrganizationParams {
  organizationSlug: string
}

export interface SendLibraryWebhookTestParams {
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  libraryId: string
  organizationSlug: string
}

export interface StartVideoViewParams {
  expires?: string
  key?: string
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  libraryId: string
  token?: string
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  videoId: string
}

export interface Storage {
  accessKeyIdHint: string
  bucket: string
  /**
   * @format date-time
   * @pattern ^(?:(?:\d\d[2468][048]|\d\d[13579][26]|\d\d0[48]|[02468][048]00|[13579][26]00)-02-29|\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\d|30)|(?:02)-(?:0[1-9]|1\d|2[0-8])))T(?:(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d+)?(?:Z))$
   */
  createdAt: string
  endpoint: string
  forcePathStyle: boolean
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  id: string
  isLocked: boolean
  /**
   * @min 0
   * @max 9007199254740991
   */
  libraryCount: number
  name: string
  pathTemplate: string
  region: string
  /**
   * @format date-time
   * @pattern ^(?:(?:\d\d[2468][048]|\d\d[13579][26]|\d\d0[48]|[02468][048]00|[13579][26]00)-02-29|\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\d|30)|(?:02)-(?:0[1-9]|1\d|2[0-8])))T(?:(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d+)?(?:Z))$
   */
  updatedAt: string
}

export interface StorageConnectionTest {
  isReachable: boolean
}

export interface StorageConnectionTestBody {
  /**
   * @minLength 1
   * @maxLength 256
   */
  accessKeyId: string
  /** @pattern ^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$ */
  bucket: string
  /** @maxLength 500 */
  endpoint: string
  forcePathStyle: boolean
  /**
   * @minLength 1
   * @maxLength 64
   */
  region: string
  /**
   * @minLength 1
   * @maxLength 256
   */
  secretAccessKey: string
}

export interface StorageConnectionTestSuccessResponse {
  code: string
  data: {
    connection: StorageConnectionTest
  }
  message: string
}

export interface StorageCreateBody {
  /**
   * @minLength 1
   * @maxLength 256
   */
  accessKeyId: string
  /** @pattern ^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$ */
  bucket: string
  /** @maxLength 500 */
  endpoint: string
  forcePathStyle: boolean
  /**
   * @minLength 1
   * @maxLength 120
   */
  name: string
  pathTemplate: string
  /**
   * @minLength 1
   * @maxLength 64
   */
  region: string
  /**
   * @minLength 1
   * @maxLength 256
   */
  secretAccessKey: string
}

export interface StorageEmptySuccessResponse {
  code: string
  data: ApiEmptyData
  message: string
}

export interface StorageListSuccessResponse {
  code: string
  data: {
    pagination: Pagination
    storages: Storage[]
  }
  message: string
}

export interface StorageSuccessResponse {
  code: string
  data: {
    storage: Storage
  }
  message: string
}

export interface StorageUpdateBody {
  /**
   * @minLength 1
   * @maxLength 256
   */
  accessKeyId?: string
  /** @pattern ^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$ */
  bucket: string
  /** @maxLength 500 */
  endpoint: string
  forcePathStyle: boolean
  /**
   * @minLength 1
   * @maxLength 120
   */
  name: string
  pathTemplate: string
  /**
   * @minLength 1
   * @maxLength 64
   */
  region: string
  /**
   * @minLength 1
   * @maxLength 256
   */
  secretAccessKey?: string
}

export interface StreamLibraryApiVideoParams {
  expires?: string
  key?: string
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  libraryId: string
  token?: string
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  videoId: string
}

export interface SuggestOrganizationSlugParams {
  /**
   * @minLength 1
   * @maxLength 120
   */
  name: string
}

export interface TestSavedStorageConnectionParams {
  organizationSlug: string
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  storageId: string
}

export interface TestStorageConnectionParams {
  organizationSlug: string
}

export interface TransferOrganizationOwnershipParams {
  organizationSlug: string
}

export interface UpdateLibraryApiKeyParams {
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  apiKeyId: string
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  libraryId: string
  organizationSlug: string
}

export interface UpdateLibraryApiVideoParams {
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  libraryId: string
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  videoId: string
}

export interface UpdateLibraryEncodingParams {
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  libraryId: string
  organizationSlug: string
}

export interface UpdateLibraryParams {
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  libraryId: string
  organizationSlug: string
}

export interface UpdateLibrarySecurityParams {
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  libraryId: string
  organizationSlug: string
}

export interface UpdateLibraryStorageParams {
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  libraryId: string
  organizationSlug: string
}

export interface UpdateOrganizationParams {
  organizationSlug: string
}

export interface UpdateStorageParams {
  organizationSlug: string
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  storageId: string
}

export interface UpdateVideoParams {
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  libraryId: string
  organizationSlug: string
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  videoId: string
}

export interface VerifyEmailParams {
  /** @pattern ^[a-f0-9]{64}$ */
  token: string
}

export interface Video {
  /**
   * @format date-time
   * @pattern ^(?:(?:\d\d[2468][048]|\d\d[13579][26]|\d\d0[48]|[02468][048]00|[13579][26]00)-02-29|\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\d|30)|(?:02)-(?:0[1-9]|1\d|2[0-8])))T(?:(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d+)?(?:Z))$
   */
  createdAt: string
  durationSeconds: number | null
  failureReason: VideoFailureReason | null
  fileFormat: VideoFileFormat | null
  fileName: string | null
  height: number | null
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  id: string
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  libraryId: string
  processedAt: string | null
  processingFailureReason: VideoProcessingFailureReason | null
  processingStatus: VideoProcessingStatus | null
  renditions: VideoRendition[]
  sizeBytes: number | null
  status: VideoStatus
  title: string
  uploadedAt: string | null
  /**
   * @min 0
   * @max 9007199254740991
   */
  uploadedBytes: number
  width: number | null
}

export interface VideoAnalytics {
  daily: AnalyticsDay[]
  devices: AnalyticsDevice[]
  embeddingHosts: AnalyticsEmbeddingHost[]
  period: AnalyticsPeriod
  retention: RetentionPoint[]
  totals: AnalyticsTotals
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  videoId: string
}

export interface VideoAnalyticsSuccessResponse {
  code: string
  data: {
    analytics: VideoAnalytics
  }
  message: string
}

export interface VideoCreateBody {
  /**
   * @minLength 1
   * @maxLength 255
   */
  fileName?: string
  /**
   * @minLength 1
   * @maxLength 200
   */
  title?: string
}

export interface VideoEmbed {
  allowedPlaybackHosts: string[]
  /** @min 0 */
  durationSeconds: number
  /**
   * @exclusiveMin 0
   * @max 9007199254740991
   */
  height: number
  /** @format uri */
  hlsUrl: string
  /** @format uri */
  posterUrl: string
  /** @format uri */
  storyboardUrl: string
  title: string
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  videoId: string
  /** @format uri */
  viewsUrl: string
  /**
   * @exclusiveMin 0
   * @max 9007199254740991
   */
  width: number
}

export interface VideoEmbedSuccessResponse {
  code: string
  data: {
    embed: VideoEmbed
  }
  message: string
}

export type VideoFailureReason = "invalid_file_type"

export type VideoFileFormat = "mp4" | "mov"

export interface VideoListSuccessResponse {
  code: string
  data: {
    videos: Video[]
  }
  message: string
}

export interface VideoPageSuccessResponse {
  code: string
  data: {
    pagination: Pagination
    videos: Video[]
  }
  message: string
}

export type VideoProcessingFailureReason =
  "no_video_stream" | "transcoding_failed"

export type VideoProcessingStatus =
  "pending" | "processing" | "ready" | "failed"

export type VideoQuality = "360p" | "480p" | "720p" | "1080p"

export interface VideoRendition {
  /**
   * @min 0
   * @max 9007199254740991
   */
  bandwidth: number
  /**
   * @exclusiveMin 0
   * @max 9007199254740991
   */
  height: number
  quality: VideoQuality
  /**
   * @exclusiveMin 0
   * @max 9007199254740991
   */
  width: number
}

export type VideoStatus = "draft" | "uploading" | "uploaded" | "failed"

export interface VideoStatusDetails {
  durationSeconds: number | null
  height: number | null
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  libraryId: string
  processedAt: string | null
  processingFailureReason: VideoProcessingFailureReason | null
  processingStatus: VideoProcessingStatus | null
  renditions: VideoRendition[]
  title: string
  uploadFailureReason: VideoFailureReason | null
  uploadStatus: VideoStatus
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  videoId: string
  width: number | null
}

export interface VideoStatusSuccessResponse {
  code: string
  data: {
    status: VideoStatusDetails
  }
  message: string
}

export interface VideoSuccessResponse {
  code: string
  data: {
    video: Video
  }
  message: string
}

export interface VideoUpdateBody {
  /**
   * @minLength 1
   * @maxLength 200
   */
  title: string
}

export interface VideoView {
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  id: string
  /**
   * @exclusiveMin 0
   * @max 9007199254740991
   */
  reportIntervalSeconds: number
}

export interface VideoViewProgressBody {
  /** @min 0 */
  positionSeconds: number
  /**
   * @min 0
   * @max 86400
   */
  watchedSeconds: number
}

export interface VideoViewProgressSuccessResponse {
  code: string
  data: {
    view: {
      /**
       * @format uuid
       * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
       */
      id: string
    }
  }
  message: string
}

export interface VideoViewStartBody {
  /** @default null */
  embeddingHost?: string | null
}

export interface VideoViewSuccessResponse {
  code: string
  data: {
    view: VideoView
  }
  message: string
}

export type ViewerDeviceType = "desktop" | "mobile" | "tablet"

export interface WebhookDelivery {
  /**
   * @min 0
   * @max 9007199254740991
   */
  attempts: number
  /**
   * @format date-time
   * @pattern ^(?:(?:\d\d[2468][048]|\d\d[13579][26]|\d\d0[48]|[02468][048]00|[13579][26]00)-02-29|\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\d|30)|(?:02)-(?:0[1-9]|1\d|2[0-8])))T(?:(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d+)?(?:Z))$
   */
  createdAt: string
  eventType: WebhookEventType
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  id: string
  lastAttemptAt: string | null
  lastError: string | null
  payload: WebhookEvent
  responseStatus: number | null
  status: WebhookDeliveryStatus
}

export interface WebhookDeliveryPageSuccessResponse {
  code: string
  data: {
    deliveries: WebhookDelivery[]
    pagination: Pagination
  }
  message: string
}

export type WebhookDeliveryStatus = "pending" | "succeeded" | "failed"

export interface WebhookDeliverySuccessResponse {
  code: string
  data: {
    delivery: WebhookDelivery
  }
  message: string
}

export interface WebhookEmptySuccessResponse {
  code: string
  data: ApiEmptyData
  message: string
}

export interface WebhookEvent {
  data: VideoStatusDetails | WebhookTestEventData
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  id: string
  /**
   * @format date-time
   * @pattern ^(?:(?:\d\d[2468][048]|\d\d[13579][26]|\d\d0[48]|[02468][048]00|[13579][26]00)-02-29|\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\d|30)|(?:02)-(?:0[1-9]|1\d|2[0-8])))T(?:(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d+)?(?:Z))$
   */
  timestamp: string
  type: WebhookEventType
}

export type WebhookEventType =
  | "video.created"
  | "video.updated"
  | "video.deleted"
  | "video.uploaded"
  | "video.upload_failed"
  | "video.processing.queued"
  | "video.processing.started"
  | "video.processing.ready"
  | "video.processing.failed"
  | "webhook.test"

export interface WebhookTestEventData {
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  libraryId: string
}

export type QueryParamsType = Record<string | number, any>
export type ResponseFormat = keyof Omit<Body, "body" | "bodyUsed">

export interface FullRequestParams extends Omit<RequestInit, "body"> {
  /** set parameter to `true` for call `securityWorker` for this request */
  secure?: boolean
  /** request path */
  path: string
  /** content type of request body */
  type?: ContentType
  /** query params */
  query?: QueryParamsType
  /** format of response (i.e. response.json() -> format: "json") */
  format?: ResponseFormat
  /** request body */
  body?: unknown
  /** base url */
  baseUrl?: string
  /** request cancellation token */
  cancelToken?: CancelToken
}

export type RequestParams = Omit<
  FullRequestParams,
  "body" | "method" | "query" | "path"
>

export interface ApiConfig<SecurityDataType = unknown> {
  baseUrl?: string
  baseApiParams?: Omit<RequestParams, "baseUrl" | "cancelToken" | "signal">
  securityWorker?: (
    securityData: SecurityDataType | null
  ) => Promise<RequestParams | void> | RequestParams | void
  customFetch?: typeof fetch
}

export interface HttpResponse<
  D extends unknown,
  E extends unknown = unknown,
> extends Response {
  data: D
  error: E
}

type CancelToken = Symbol | string | number

export type ContentType =
  | "application/json"
  | "application/vnd.api+json"
  | "multipart/form-data"
  | "application/x-www-form-urlencoded"
  | "text/plain"

export class HttpClient<SecurityDataType = unknown> {
  public baseUrl: string = ""
  private securityData: SecurityDataType | null = null
  private securityWorker?: ApiConfig<SecurityDataType>["securityWorker"]
  private abortControllers = new Map<CancelToken, AbortController>()
  private customFetch = (...fetchParams: Parameters<typeof fetch>) =>
    fetch(...fetchParams)

  private baseApiParams: RequestParams = {
    credentials: "same-origin",
    headers: {},
    redirect: "follow",
    referrerPolicy: "no-referrer",
  }

  constructor(apiConfig: ApiConfig<SecurityDataType> = {}) {
    Object.assign(this, apiConfig)
  }

  public setSecurityData = (data: SecurityDataType | null) => {
    this.securityData = data
  }

  protected encodeQueryParam(key: string, value: any) {
    const encodedKey = encodeURIComponent(key)
    return `${encodedKey}=${encodeURIComponent(typeof value === "number" ? value : `${value}`)}`
  }

  protected addQueryParam(query: QueryParamsType, key: string) {
    return this.encodeQueryParam(key, query[key])
  }

  protected addArrayQueryParam(query: QueryParamsType, key: string) {
    const value = query[key]
    return value.map((v: any) => this.encodeQueryParam(key, v)).join("&")
  }

  protected toQueryString(rawQuery?: QueryParamsType): string {
    const query = rawQuery || {}
    const keys = Object.keys(query).filter(
      (key) => "undefined" !== typeof query[key]
    )
    return keys
      .map((key) =>
        Array.isArray(query[key])
          ? this.addArrayQueryParam(query, key)
          : this.addQueryParam(query, key)
      )
      .join("&")
  }

  protected addQueryParams(rawQuery?: QueryParamsType): string {
    const queryString = this.toQueryString(rawQuery)
    return queryString ? `?${queryString}` : ""
  }

  private contentFormatters: Record<ContentType, (input: any) => any> = {
    ["application/json"]: (input: any) =>
      input !== null && (typeof input === "object" || typeof input === "string")
        ? JSON.stringify(input)
        : input,
    ["application/vnd.api+json"]: (input: any) =>
      input !== null && (typeof input === "object" || typeof input === "string")
        ? JSON.stringify(input)
        : input,
    ["text/plain"]: (input: any) =>
      input !== null && typeof input !== "string"
        ? JSON.stringify(input)
        : input,
    ["multipart/form-data"]: (input: any) => {
      if (input instanceof FormData) {
        return input
      }

      return Object.keys(input || {}).reduce((formData, key) => {
        const property = input[key]
        formData.append(
          key,
          property instanceof Blob
            ? property
            : typeof property === "object" && property !== null
              ? JSON.stringify(property)
              : `${property}`
        )
        return formData
      }, new FormData())
    },
    ["application/x-www-form-urlencoded"]: (input: any) =>
      this.toQueryString(input),
  }

  protected mergeRequestParams(
    params1: RequestParams,
    params2?: RequestParams
  ): RequestParams {
    return {
      ...this.baseApiParams,
      ...params1,
      ...(params2 || {}),
      headers: {
        ...(this.baseApiParams.headers || {}),
        ...(params1.headers || {}),
        ...((params2 && params2.headers) || {}),
      },
    }
  }

  protected createAbortSignal = (
    cancelToken: CancelToken
  ): AbortSignal | undefined => {
    if (this.abortControllers.has(cancelToken)) {
      const abortController = this.abortControllers.get(cancelToken)
      if (abortController) {
        return abortController.signal
      }
      return void 0
    }

    const abortController = new AbortController()
    this.abortControllers.set(cancelToken, abortController)
    return abortController.signal
  }

  public abortRequest = (cancelToken: CancelToken) => {
    const abortController = this.abortControllers.get(cancelToken)

    if (abortController) {
      abortController.abort()
      this.abortControllers.delete(cancelToken)
    }
  }

  public request = async <T = any, E = any>({
    body,
    secure,
    path,
    type,
    query,
    format,
    baseUrl,
    cancelToken,
    ...params
  }: FullRequestParams): Promise<T> => {
    const secureParams =
      ((typeof secure === "boolean" ? secure : this.baseApiParams.secure) &&
        this.securityWorker &&
        (await this.securityWorker(this.securityData))) ||
      {}
    const requestParams = this.mergeRequestParams(params, secureParams)
    const queryString = query && this.toQueryString(query)
    const payloadFormatter = this.contentFormatters[type || "application/json"]
    const responseFormat = format || requestParams.format

    return this.customFetch(
      `${baseUrl || this.baseUrl || ""}${path}${queryString ? `?${queryString}` : ""}`,
      {
        ...requestParams,
        headers: {
          ...(requestParams.headers || {}),
          ...(type && type !== "multipart/form-data"
            ? { "Content-Type": type }
            : {}),
        },
        signal:
          (cancelToken
            ? this.createAbortSignal(cancelToken)
            : requestParams.signal) || null,
        body:
          typeof body === "undefined" || body === null
            ? null
            : payloadFormatter(body),
      }
    ).then(async (response) => {
      const r = response as HttpResponse<T, E>
      r.data = null as unknown as T
      r.error = null as unknown as E

      const responseToParse = responseFormat ? response.clone() : response
      const data = !responseFormat
        ? r
        : await responseToParse[responseFormat]()
            .then((data) => {
              if (r.ok) {
                r.data = data
              } else {
                r.error = data
              }
              return r
            })
            .catch((e) => {
              r.error = e
              return r
            })

      if (cancelToken) {
        this.abortControllers.delete(cancelToken)
      }

      if (!response.ok) throw data
      return data.data
    })
  }
}

/**
 * @title OpenStream API
 * @version 1.0.0
 *
 * HTTP API of the OpenStream video platform.
 */
export class OpenStreamApi<
  SecurityDataType extends unknown,
> extends HttpClient<SecurityDataType> {
  auth = {
    /**
     * No description
     *
     * @tags Auth
     * @name SignUpWithEmail
     * @summary Create an account and send the verification email
     * @request POST:/api/v1/auth/sign-up/email
     */
    signUpWithEmail: (data: AuthSignUpBody, params: RequestParams = {}) =>
      this.request<AuthEmptySuccessResponse, ApiErrorResponse>({
        path: `/api/v1/auth/sign-up/email`,
        method: "POST",
        body: data,
        type: "application/json",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Auth
     * @name SignInWithEmail
     * @summary Sign in and set the session cookie
     * @request POST:/api/v1/auth/sign-in/email
     */
    signInWithEmail: (data: AuthSignInBody, params: RequestParams = {}) =>
      this.request<AuthSignInSuccessResponse, ApiErrorResponse>({
        path: `/api/v1/auth/sign-in/email`,
        method: "POST",
        body: data,
        type: "application/json",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Auth
     * @name SignOut
     * @summary Revoke the current session and clear its cookie
     * @request POST:/api/v1/auth/sign-out
     */
    signOut: (params: RequestParams = {}) =>
      this.request<AuthEmptySuccessResponse, ApiErrorResponse>({
        path: `/api/v1/auth/sign-out`,
        method: "POST",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Auth
     * @name GetSession
     * @summary Read the session of the current cookie
     * @request GET:/api/v1/auth/session
     */
    getSession: (params: RequestParams = {}) =>
      this.request<AuthSessionSuccessResponse, any>({
        path: `/api/v1/auth/session`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Auth
     * @name RequestPasswordReset
     * @summary Send a password reset email if the account exists
     * @request POST:/api/v1/auth/forgot-password
     */
    requestPasswordReset: (
      data: AuthForgotPasswordBody,
      params: RequestParams = {}
    ) =>
      this.request<AuthEmptySuccessResponse, ApiErrorResponse>({
        path: `/api/v1/auth/forgot-password`,
        method: "POST",
        body: data,
        type: "application/json",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Auth
     * @name ResetPassword
     * @summary Set a new password and revoke every session of the user
     * @request POST:/api/v1/auth/reset-password
     */
    resetPassword: (data: AuthResetPasswordBody, params: RequestParams = {}) =>
      this.request<AuthEmptySuccessResponse, ApiErrorResponse>({
        path: `/api/v1/auth/reset-password`,
        method: "POST",
        body: data,
        type: "application/json",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Auth
     * @name VerifyEmail
     * @summary Consume an email verification link
     * @request GET:/api/v1/auth/verify-email
     */
    verifyEmail: (query: VerifyEmailParams, params: RequestParams = {}) =>
      this.request<AuthEmptySuccessResponse, ApiErrorResponse>({
        path: `/api/v1/auth/verify-email`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),
  }
  organizations = {
    /**
     * No description
     *
     * @tags Organizations
     * @name GetOrganizationContext
     * @summary List the user's organizations, pending invitations and membership limit
     * @request GET:/api/v1/organizations/context
     */
    getOrganizationContext: (params: RequestParams = {}) =>
      this.request<OrganizationContextSuccessResponse, ApiErrorResponse>({
        path: `/api/v1/organizations/context`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Organizations
     * @name SuggestOrganizationSlug
     * @summary Suggest a free organization address for a name
     * @request GET:/api/v1/organizations/slug-suggestion
     */
    suggestOrganizationSlug: (
      query: SuggestOrganizationSlugParams,
      params: RequestParams = {}
    ) =>
      this.request<OrganizationSlugSuggestionSuccessResponse, ApiErrorResponse>(
        {
          path: `/api/v1/organizations/slug-suggestion`,
          method: "GET",
          query: query,
          format: "json",
          ...params,
        }
      ),

    /**
     * No description
     *
     * @tags Organizations
     * @name CreateOrganization
     * @summary Create an organization owned by the user
     * @request POST:/api/v1/organizations
     */
    createOrganization: (
      data: OrganizationCreateBody,
      params: RequestParams = {}
    ) =>
      this.request<OrganizationCreateSuccessResponse, ApiErrorResponse>({
        path: `/api/v1/organizations`,
        method: "POST",
        body: data,
        type: "application/json",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Organizations
     * @name GetOrganization
     * @summary Read an organization and the user's membership in it
     * @request GET:/api/v1/organizations/{organizationSlug}
     */
    getOrganization: (
      { organizationSlug }: GetOrganizationParams,
      params: RequestParams = {}
    ) =>
      this.request<OrganizationGetSuccessResponse, ApiErrorResponse>({
        path: `/api/v1/organizations/${organizationSlug}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Organizations
     * @name UpdateOrganization
     * @summary Rename the organization or change its address
     * @request PATCH:/api/v1/organizations/{organizationSlug}
     */
    updateOrganization: (
      { organizationSlug }: UpdateOrganizationParams,
      data: OrganizationUpdateBody,
      params: RequestParams = {}
    ) =>
      this.request<OrganizationSummarySuccessResponse, ApiErrorResponse>({
        path: `/api/v1/organizations/${organizationSlug}`,
        method: "PATCH",
        body: data,
        type: "application/json",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Organizations
     * @name SelectOrganization
     * @summary Remember the organization as the user's current one
     * @request POST:/api/v1/organizations/{organizationSlug}/select
     */
    selectOrganization: (
      { organizationSlug }: SelectOrganizationParams,
      params: RequestParams = {}
    ) =>
      this.request<OrganizationEmptySuccessResponse, ApiErrorResponse>({
        path: `/api/v1/organizations/${organizationSlug}/select`,
        method: "POST",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Organizations
     * @name LeaveOrganization
     * @summary Leave the organization (members only)
     * @request DELETE:/api/v1/organizations/{organizationSlug}/members/me
     */
    leaveOrganization: (
      { organizationSlug }: LeaveOrganizationParams,
      params: RequestParams = {}
    ) =>
      this.request<OrganizationEmptySuccessResponse, ApiErrorResponse>({
        path: `/api/v1/organizations/${organizationSlug}/members/me`,
        method: "DELETE",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Organizations
     * @name TransferOrganizationOwnership
     * @summary Make a member the owner; the current owner becomes a member
     * @request POST:/api/v1/organizations/{organizationSlug}/ownership-transfer
     */
    transferOrganizationOwnership: (
      { organizationSlug }: TransferOrganizationOwnershipParams,
      data: OrganizationOwnershipTransferBody,
      params: RequestParams = {}
    ) =>
      this.request<OrganizationEmptySuccessResponse, ApiErrorResponse>({
        path: `/api/v1/organizations/${organizationSlug}/ownership-transfer`,
        method: "POST",
        body: data,
        type: "application/json",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Organizations
     * @name GetOrganizationTeam
     * @summary List members, and open invitations for the owner
     * @request GET:/api/v1/organizations/{organizationSlug}/team
     */
    getOrganizationTeam: (
      { organizationSlug }: GetOrganizationTeamParams,
      params: RequestParams = {}
    ) =>
      this.request<OrganizationTeamSuccessResponse, ApiErrorResponse>({
        path: `/api/v1/organizations/${organizationSlug}/team`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Organizations
     * @name InviteOrganizationMember
     * @summary Invite an email address to join as a member
     * @request POST:/api/v1/organizations/{organizationSlug}/team/invitations
     */
    inviteOrganizationMember: (
      { organizationSlug }: InviteOrganizationMemberParams,
      data: OrganizationInvitationCreateBody,
      params: RequestParams = {}
    ) =>
      this.request<OrganizationInvitationSuccessResponse, ApiErrorResponse>({
        path: `/api/v1/organizations/${organizationSlug}/team/invitations`,
        method: "POST",
        body: data,
        type: "application/json",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Organizations
     * @name ResendOrganizationInvitation
     * @summary Send a pending or expired invitation again with a new expiry
     * @request POST:/api/v1/organizations/{organizationSlug}/team/invitations/{invitationId}/resend
     */
    resendOrganizationInvitation: (
      { organizationSlug, invitationId }: ResendOrganizationInvitationParams,
      params: RequestParams = {}
    ) =>
      this.request<OrganizationInvitationSuccessResponse, ApiErrorResponse>({
        path: `/api/v1/organizations/${organizationSlug}/team/invitations/${invitationId}/resend`,
        method: "POST",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Organizations
     * @name CancelOrganizationInvitation
     * @summary Cancel a pending or expired invitation
     * @request DELETE:/api/v1/organizations/{organizationSlug}/team/invitations/{invitationId}
     */
    cancelOrganizationInvitation: (
      { organizationSlug, invitationId }: CancelOrganizationInvitationParams,
      params: RequestParams = {}
    ) =>
      this.request<OrganizationEmptySuccessResponse, ApiErrorResponse>({
        path: `/api/v1/organizations/${organizationSlug}/team/invitations/${invitationId}`,
        method: "DELETE",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Organizations
     * @name RemoveOrganizationMember
     * @summary Remove a member from the organization
     * @request DELETE:/api/v1/organizations/{organizationSlug}/team/members/{membershipId}
     */
    removeOrganizationMember: (
      { organizationSlug, membershipId }: RemoveOrganizationMemberParams,
      params: RequestParams = {}
    ) =>
      this.request<OrganizationEmptySuccessResponse, ApiErrorResponse>({
        path: `/api/v1/organizations/${organizationSlug}/team/members/${membershipId}`,
        method: "DELETE",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Organizations
     * @name ScheduleOrganizationDeletion
     * @summary Disable the organization now and delete it after the grace period
     * @request POST:/api/v1/organizations/{organizationSlug}/deletion
     */
    scheduleOrganizationDeletion: (
      { organizationSlug }: ScheduleOrganizationDeletionParams,
      data: OrganizationDeletionScheduleBody,
      params: RequestParams = {}
    ) =>
      this.request<OrganizationSummarySuccessResponse, ApiErrorResponse>({
        path: `/api/v1/organizations/${organizationSlug}/deletion`,
        method: "POST",
        body: data,
        type: "application/json",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Organizations
     * @name CancelOrganizationDeletion
     * @summary Cancel the scheduled deletion and reactivate the organization
     * @request DELETE:/api/v1/organizations/{organizationSlug}/deletion
     */
    cancelOrganizationDeletion: (
      { organizationSlug }: CancelOrganizationDeletionParams,
      params: RequestParams = {}
    ) =>
      this.request<OrganizationEmptySuccessResponse, ApiErrorResponse>({
        path: `/api/v1/organizations/${organizationSlug}/deletion`,
        method: "DELETE",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Organizations
     * @name AcceptOrganizationInvitation
     * @summary Join the organization of an invitation
     * @request POST:/api/v1/invitations/{invitationId}/accept
     */
    acceptOrganizationInvitation: (
      { invitationId }: AcceptOrganizationInvitationParams,
      params: RequestParams = {}
    ) =>
      this.request<OrganizationSummarySuccessResponse, ApiErrorResponse>({
        path: `/api/v1/invitations/${invitationId}/accept`,
        method: "POST",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Organizations
     * @name DeclineOrganizationInvitation
     * @summary Decline an invitation
     * @request POST:/api/v1/invitations/{invitationId}/decline
     */
    declineOrganizationInvitation: (
      { invitationId }: DeclineOrganizationInvitationParams,
      params: RequestParams = {}
    ) =>
      this.request<OrganizationEmptySuccessResponse, ApiErrorResponse>({
        path: `/api/v1/invitations/${invitationId}/decline`,
        method: "POST",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Organizations
     * @name CancelOrganizationDeletionByToken
     * @summary Cancel a scheduled deletion with the emailed link
     * @request POST:/api/v1/organization-deletion-actions/cancel
     */
    cancelOrganizationDeletionByToken: (
      data: OrganizationDeletionActionBody,
      params: RequestParams = {}
    ) =>
      this.request<OrganizationEmptySuccessResponse, ApiErrorResponse>({
        path: `/api/v1/organization-deletion-actions/cancel`,
        method: "POST",
        body: data,
        type: "application/json",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Organizations
     * @name DeleteOrganizationByToken
     * @summary Permanently delete a scheduled organization right away
     * @request POST:/api/v1/organization-deletion-actions/delete
     */
    deleteOrganizationByToken: (
      data: OrganizationDeletionActionBody,
      params: RequestParams = {}
    ) =>
      this.request<OrganizationEmptySuccessResponse, ApiErrorResponse>({
        path: `/api/v1/organization-deletion-actions/delete`,
        method: "POST",
        body: data,
        type: "application/json",
        format: "json",
        ...params,
      }),
  }
  storages = {
    /**
     * No description
     *
     * @tags Storages
     * @name ListStorages
     * @summary List and search the organization's storages, a page at a time
     * @request GET:/api/v1/organizations/{organizationSlug}/storages
     */
    listStorages: (
      { organizationSlug, ...query }: ListStoragesParams,
      params: RequestParams = {}
    ) =>
      this.request<StorageListSuccessResponse, ApiErrorResponse>({
        path: `/api/v1/organizations/${organizationSlug}/storages`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Storages
     * @name CreateStorage
     * @summary Connect an S3-compatible bucket
     * @request POST:/api/v1/organizations/{organizationSlug}/storages
     */
    createStorage: (
      { organizationSlug }: CreateStorageParams,
      data: StorageCreateBody,
      params: RequestParams = {}
    ) =>
      this.request<StorageSuccessResponse, ApiErrorResponse>({
        path: `/api/v1/organizations/${organizationSlug}/storages`,
        method: "POST",
        body: data,
        type: "application/json",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Storages
     * @name TestStorageConnection
     * @summary Check unsaved storage settings can reach their bucket
     * @request POST:/api/v1/organizations/{organizationSlug}/storages/connection-tests
     */
    testStorageConnection: (
      { organizationSlug }: TestStorageConnectionParams,
      data: StorageConnectionTestBody,
      params: RequestParams = {}
    ) =>
      this.request<StorageConnectionTestSuccessResponse, ApiErrorResponse>({
        path: `/api/v1/organizations/${organizationSlug}/storages/connection-tests`,
        method: "POST",
        body: data,
        type: "application/json",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Storages
     * @name GetStorage
     * @summary Read a storage
     * @request GET:/api/v1/organizations/{organizationSlug}/storages/{storageId}
     */
    getStorage: (
      { organizationSlug, storageId }: GetStorageParams,
      params: RequestParams = {}
    ) =>
      this.request<StorageSuccessResponse, ApiErrorResponse>({
        path: `/api/v1/organizations/${organizationSlug}/storages/${storageId}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Storages
     * @name UpdateStorage
     * @summary Change a storage's name, settings or credentials
     * @request PATCH:/api/v1/organizations/{organizationSlug}/storages/{storageId}
     */
    updateStorage: (
      { organizationSlug, storageId }: UpdateStorageParams,
      data: StorageUpdateBody,
      params: RequestParams = {}
    ) =>
      this.request<StorageSuccessResponse, ApiErrorResponse>({
        path: `/api/v1/organizations/${organizationSlug}/storages/${storageId}`,
        method: "PATCH",
        body: data,
        type: "application/json",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Storages
     * @name DeleteStorage
     * @summary Delete a storage no library uses
     * @request DELETE:/api/v1/organizations/{organizationSlug}/storages/{storageId}
     */
    deleteStorage: (
      { organizationSlug, storageId }: DeleteStorageParams,
      params: RequestParams = {}
    ) =>
      this.request<StorageEmptySuccessResponse, ApiErrorResponse>({
        path: `/api/v1/organizations/${organizationSlug}/storages/${storageId}`,
        method: "DELETE",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Storages
     * @name TestSavedStorageConnection
     * @summary Check a saved storage can still reach its bucket
     * @request POST:/api/v1/organizations/{organizationSlug}/storages/{storageId}/connection-tests
     */
    testSavedStorageConnection: (
      { organizationSlug, storageId }: TestSavedStorageConnectionParams,
      params: RequestParams = {}
    ) =>
      this.request<StorageConnectionTestSuccessResponse, ApiErrorResponse>({
        path: `/api/v1/organizations/${organizationSlug}/storages/${storageId}/connection-tests`,
        method: "POST",
        format: "json",
        ...params,
      }),
  }
  libraries = {
    /**
     * No description
     *
     * @tags Libraries
     * @name ListLibraries
     * @summary List and search the organization's video libraries, a page at a time
     * @request GET:/api/v1/organizations/{organizationSlug}/libraries
     */
    listLibraries: (
      { organizationSlug, ...query }: ListLibrariesParams,
      params: RequestParams = {}
    ) =>
      this.request<LibraryListSuccessResponse, ApiErrorResponse>({
        path: `/api/v1/organizations/${organizationSlug}/libraries`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Libraries
     * @name CreateLibrary
     * @summary Create a video library
     * @request POST:/api/v1/organizations/{organizationSlug}/libraries
     */
    createLibrary: (
      { organizationSlug }: CreateLibraryParams,
      data: LibraryCreateBody,
      params: RequestParams = {}
    ) =>
      this.request<LibrarySuccessResponse, ApiErrorResponse>({
        path: `/api/v1/organizations/${organizationSlug}/libraries`,
        method: "POST",
        body: data,
        type: "application/json",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Libraries
     * @name GetLibrary
     * @summary Read a video library
     * @request GET:/api/v1/organizations/{organizationSlug}/libraries/{libraryId}
     */
    getLibrary: (
      { organizationSlug, libraryId }: GetLibraryParams,
      params: RequestParams = {}
    ) =>
      this.request<LibrarySuccessResponse, ApiErrorResponse>({
        path: `/api/v1/organizations/${organizationSlug}/libraries/${libraryId}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Libraries
     * @name UpdateLibrary
     * @summary Rename a video library
     * @request PATCH:/api/v1/organizations/{organizationSlug}/libraries/{libraryId}
     */
    updateLibrary: (
      { organizationSlug, libraryId }: UpdateLibraryParams,
      data: LibraryUpdateBody,
      params: RequestParams = {}
    ) =>
      this.request<LibrarySuccessResponse, ApiErrorResponse>({
        path: `/api/v1/organizations/${organizationSlug}/libraries/${libraryId}`,
        method: "PATCH",
        body: data,
        type: "application/json",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Libraries
     * @name GetLibraryStorage
     * @summary Read where the library stores its videos
     * @request GET:/api/v1/organizations/{organizationSlug}/libraries/{libraryId}/storage
     */
    getLibraryStorage: (
      { organizationSlug, libraryId }: GetLibraryStorageParams,
      params: RequestParams = {}
    ) =>
      this.request<LibraryStorageSuccessResponse, ApiErrorResponse>({
        path: `/api/v1/organizations/${organizationSlug}/libraries/${libraryId}/storage`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Libraries
     * @name UpdateLibraryStorage
     * @summary Store the library's videos in one of the organization's storages, or in the default storage
     * @request PUT:/api/v1/organizations/{organizationSlug}/libraries/{libraryId}/storage
     */
    updateLibraryStorage: (
      { organizationSlug, libraryId }: UpdateLibraryStorageParams,
      data: LibraryStorageUpdateBody,
      params: RequestParams = {}
    ) =>
      this.request<LibraryStorageSuccessResponse, ApiErrorResponse>({
        path: `/api/v1/organizations/${organizationSlug}/libraries/${libraryId}/storage`,
        method: "PUT",
        body: data,
        type: "application/json",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Libraries
     * @name GetLibraryEncoding
     * @summary Read which qualities the library transcodes uploads to
     * @request GET:/api/v1/organizations/{organizationSlug}/libraries/{libraryId}/encoding
     */
    getLibraryEncoding: (
      { organizationSlug, libraryId }: GetLibraryEncodingParams,
      params: RequestParams = {}
    ) =>
      this.request<LibraryEncodingSuccessResponse, ApiErrorResponse>({
        path: `/api/v1/organizations/${organizationSlug}/libraries/${libraryId}/encoding`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Libraries
     * @name UpdateLibraryEncoding
     * @summary Choose the qualities new uploads are transcoded to; reprocess earlier videos to apply them
     * @request PUT:/api/v1/organizations/{organizationSlug}/libraries/{libraryId}/encoding
     */
    updateLibraryEncoding: (
      { organizationSlug, libraryId }: UpdateLibraryEncodingParams,
      data: LibraryEncodingUpdateBody,
      params: RequestParams = {}
    ) =>
      this.request<LibraryEncodingSuccessResponse, ApiErrorResponse>({
        path: `/api/v1/organizations/${organizationSlug}/libraries/${libraryId}/encoding`,
        method: "PUT",
        body: data,
        type: "application/json",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Libraries
     * @name GetLibraryApiAccess
     * @summary Read the library's API identifier, keys and security settings
     * @request GET:/api/v1/organizations/{organizationSlug}/libraries/{libraryId}/api-access
     */
    getLibraryApiAccess: (
      { organizationSlug, libraryId }: GetLibraryApiAccessParams,
      params: RequestParams = {}
    ) =>
      this.request<LibraryApiAccessSuccessResponse, ApiErrorResponse>({
        path: `/api/v1/organizations/${organizationSlug}/libraries/${libraryId}/api-access`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Libraries
     * @name CreateLibraryApiKey
     * @summary Create a named API key with the given scopes; its secret is shown only once
     * @request POST:/api/v1/organizations/{organizationSlug}/libraries/{libraryId}/api-keys
     */
    createLibraryApiKey: (
      { organizationSlug, libraryId }: CreateLibraryApiKeyParams,
      data: LibraryApiKeyCreateBody,
      params: RequestParams = {}
    ) =>
      this.request<LibraryApiKeySecretSuccessResponse, ApiErrorResponse>({
        path: `/api/v1/organizations/${organizationSlug}/libraries/${libraryId}/api-keys`,
        method: "POST",
        body: data,
        type: "application/json",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Libraries
     * @name UpdateLibraryApiKey
     * @summary Rename an API key or change its scopes
     * @request PATCH:/api/v1/organizations/{organizationSlug}/libraries/{libraryId}/api-keys/{apiKeyId}
     */
    updateLibraryApiKey: (
      { organizationSlug, libraryId, apiKeyId }: UpdateLibraryApiKeyParams,
      data: LibraryApiKeyUpdateBody,
      params: RequestParams = {}
    ) =>
      this.request<LibraryApiKeySuccessResponse, ApiErrorResponse>({
        path: `/api/v1/organizations/${organizationSlug}/libraries/${libraryId}/api-keys/${apiKeyId}`,
        method: "PATCH",
        body: data,
        type: "application/json",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Libraries
     * @name DeleteLibraryApiKey
     * @summary Revoke an API key and the playback URLs it signed
     * @request DELETE:/api/v1/organizations/{organizationSlug}/libraries/{libraryId}/api-keys/{apiKeyId}
     */
    deleteLibraryApiKey: (
      { organizationSlug, libraryId, apiKeyId }: DeleteLibraryApiKeyParams,
      params: RequestParams = {}
    ) =>
      this.request<LibraryEmptySuccessResponse, ApiErrorResponse>({
        path: `/api/v1/organizations/${organizationSlug}/libraries/${libraryId}/api-keys/${apiKeyId}`,
        method: "DELETE",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Libraries
     * @name RollLibraryApiKey
     * @summary Give an API key a new secret; the old secret and the playback URLs it signed stop working
     * @request POST:/api/v1/organizations/{organizationSlug}/libraries/{libraryId}/api-keys/{apiKeyId}/roll
     */
    rollLibraryApiKey: (
      { organizationSlug, libraryId, apiKeyId }: RollLibraryApiKeyParams,
      params: RequestParams = {}
    ) =>
      this.request<LibraryApiKeySecretSuccessResponse, ApiErrorResponse>({
        path: `/api/v1/organizations/${organizationSlug}/libraries/${libraryId}/api-keys/${apiKeyId}/roll`,
        method: "POST",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Libraries
     * @name UpdateLibrarySecurity
     * @summary Choose which sites may play the library's videos, and how
     * @request PUT:/api/v1/organizations/{organizationSlug}/libraries/{libraryId}/security
     */
    updateLibrarySecurity: (
      { organizationSlug, libraryId }: UpdateLibrarySecurityParams,
      data: LibrarySecurityUpdateBody,
      params: RequestParams = {}
    ) =>
      this.request<LibraryApiAccessSuccessResponse, ApiErrorResponse>({
        path: `/api/v1/organizations/${organizationSlug}/libraries/${libraryId}/security`,
        method: "PUT",
        body: data,
        type: "application/json",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Libraries
     * @name GetLibraryWebhook
     * @summary Read the library's webhook; null when it has none
     * @request GET:/api/v1/organizations/{organizationSlug}/libraries/{libraryId}/webhook
     */
    getLibraryWebhook: (
      { organizationSlug, libraryId }: GetLibraryWebhookParams,
      params: RequestParams = {}
    ) =>
      this.request<LibraryWebhookSuccessResponse, ApiErrorResponse>({
        path: `/api/v1/organizations/${organizationSlug}/libraries/${libraryId}/webhook`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Libraries
     * @name SaveLibraryWebhook
     * @summary Set the URL events are sent to; a new webhook's signing secret is shown only in this response
     * @request PUT:/api/v1/organizations/{organizationSlug}/libraries/{libraryId}/webhook
     */
    saveLibraryWebhook: (
      { organizationSlug, libraryId }: SaveLibraryWebhookParams,
      data: LibraryWebhookSaveBody,
      params: RequestParams = {}
    ) =>
      this.request<LibraryWebhookSecretSuccessResponse, ApiErrorResponse>({
        path: `/api/v1/organizations/${organizationSlug}/libraries/${libraryId}/webhook`,
        method: "PUT",
        body: data,
        type: "application/json",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Libraries
     * @name DeleteLibraryWebhook
     * @summary Stop sending events, and forget what was sent
     * @request DELETE:/api/v1/organizations/{organizationSlug}/libraries/{libraryId}/webhook
     */
    deleteLibraryWebhook: (
      { organizationSlug, libraryId }: DeleteLibraryWebhookParams,
      params: RequestParams = {}
    ) =>
      this.request<WebhookEmptySuccessResponse, ApiErrorResponse>({
        path: `/api/v1/organizations/${organizationSlug}/libraries/${libraryId}/webhook`,
        method: "DELETE",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Libraries
     * @name RollLibraryWebhookSecret
     * @summary Give the webhook a new signing secret, shown only in this response
     * @request POST:/api/v1/organizations/{organizationSlug}/libraries/{libraryId}/webhook/roll-secret
     */
    rollLibraryWebhookSecret: (
      { organizationSlug, libraryId }: RollLibraryWebhookSecretParams,
      params: RequestParams = {}
    ) =>
      this.request<LibraryWebhookSecretSuccessResponse, ApiErrorResponse>({
        path: `/api/v1/organizations/${organizationSlug}/libraries/${libraryId}/webhook/roll-secret`,
        method: "POST",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Libraries
     * @name SendLibraryWebhookTest
     * @summary Send a `webhook.test` event to check the endpoint
     * @request POST:/api/v1/organizations/{organizationSlug}/libraries/{libraryId}/webhook/test
     */
    sendLibraryWebhookTest: (
      { organizationSlug, libraryId }: SendLibraryWebhookTestParams,
      params: RequestParams = {}
    ) =>
      this.request<WebhookDeliverySuccessResponse, ApiErrorResponse>({
        path: `/api/v1/organizations/${organizationSlug}/libraries/${libraryId}/webhook/test`,
        method: "POST",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Libraries
     * @name ListLibraryWebhookDeliveries
     * @summary List events sent to the webhook, newest first
     * @request GET:/api/v1/organizations/{organizationSlug}/libraries/{libraryId}/webhook/deliveries
     */
    listLibraryWebhookDeliveries: (
      {
        organizationSlug,
        libraryId,
        ...query
      }: ListLibraryWebhookDeliveriesParams,
      params: RequestParams = {}
    ) =>
      this.request<WebhookDeliveryPageSuccessResponse, ApiErrorResponse>({
        path: `/api/v1/organizations/${organizationSlug}/libraries/${libraryId}/webhook/deliveries`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Libraries
     * @name ResendLibraryWebhookDelivery
     * @summary Send a finished delivery again, unchanged, to the webhook's current URL
     * @request POST:/api/v1/organizations/{organizationSlug}/libraries/{libraryId}/webhook/deliveries/{deliveryId}/resend
     */
    resendLibraryWebhookDelivery: (
      {
        organizationSlug,
        libraryId,
        deliveryId,
      }: ResendLibraryWebhookDeliveryParams,
      params: RequestParams = {}
    ) =>
      this.request<WebhookDeliverySuccessResponse, ApiErrorResponse>({
        path: `/api/v1/organizations/${organizationSlug}/libraries/${libraryId}/webhook/deliveries/${deliveryId}/resend`,
        method: "POST",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Libraries
     * @name ListVideos
     * @summary List the library's videos, newest first
     * @request GET:/api/v1/organizations/{organizationSlug}/libraries/{libraryId}/videos
     */
    listVideos: (
      { organizationSlug, libraryId }: ListVideosParams,
      params: RequestParams = {}
    ) =>
      this.request<VideoListSuccessResponse, ApiErrorResponse>({
        path: `/api/v1/organizations/${organizationSlug}/libraries/${libraryId}/videos`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Libraries
     * @name CreateVideo
     * @summary Create a draft video, titled explicitly or after the file it will receive
     * @request POST:/api/v1/organizations/{organizationSlug}/libraries/{libraryId}/videos
     */
    createVideo: (
      { organizationSlug, libraryId }: CreateVideoParams,
      data: VideoCreateBody,
      params: RequestParams = {}
    ) =>
      this.request<VideoSuccessResponse, ApiErrorResponse>({
        path: `/api/v1/organizations/${organizationSlug}/libraries/${libraryId}/videos`,
        method: "POST",
        body: data,
        type: "application/json",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Libraries
     * @name GetVideo
     * @summary Read a video and its upload state
     * @request GET:/api/v1/organizations/{organizationSlug}/libraries/{libraryId}/videos/{videoId}
     */
    getVideo: (
      { organizationSlug, libraryId, videoId }: GetVideoParams,
      params: RequestParams = {}
    ) =>
      this.request<VideoSuccessResponse, ApiErrorResponse>({
        path: `/api/v1/organizations/${organizationSlug}/libraries/${libraryId}/videos/${videoId}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Libraries
     * @name UpdateVideo
     * @summary Rename a video
     * @request PATCH:/api/v1/organizations/{organizationSlug}/libraries/{libraryId}/videos/{videoId}
     */
    updateVideo: (
      { organizationSlug, libraryId, videoId }: UpdateVideoParams,
      data: VideoUpdateBody,
      params: RequestParams = {}
    ) =>
      this.request<VideoSuccessResponse, ApiErrorResponse>({
        path: `/api/v1/organizations/${organizationSlug}/libraries/${libraryId}/videos/${videoId}`,
        method: "PATCH",
        body: data,
        type: "application/json",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Libraries
     * @name DeleteVideo
     * @summary Delete a video and its stored file
     * @request DELETE:/api/v1/organizations/{organizationSlug}/libraries/{libraryId}/videos/{videoId}
     */
    deleteVideo: (
      { organizationSlug, libraryId, videoId }: DeleteVideoParams,
      params: RequestParams = {}
    ) =>
      this.request<LibraryEmptySuccessResponse, ApiErrorResponse>({
        path: `/api/v1/organizations/${organizationSlug}/libraries/${libraryId}/videos/${videoId}`,
        method: "DELETE",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Libraries
     * @name ReprocessVideo
     * @summary Transcode a processed or failed video again, with the library's current qualities
     * @request POST:/api/v1/organizations/{organizationSlug}/libraries/{libraryId}/videos/{videoId}/reprocess
     */
    reprocessVideo: (
      { organizationSlug, libraryId, videoId }: ReprocessVideoParams,
      params: RequestParams = {}
    ) =>
      this.request<VideoSuccessResponse, ApiErrorResponse>({
        path: `/api/v1/organizations/${organizationSlug}/libraries/${libraryId}/videos/${videoId}/reprocess`,
        method: "POST",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Libraries
     * @name GetVideoPoster
     * @summary Read a processed video's poster, for previews in the web app
     * @request GET:/api/v1/organizations/{organizationSlug}/libraries/{libraryId}/videos/{videoId}/poster.jpg
     */
    getVideoPoster: (
      { organizationSlug, libraryId, videoId }: GetVideoPosterParams,
      params: RequestParams = {}
    ) =>
      this.request<Blob, ApiErrorResponse>({
        path: `/api/v1/organizations/${organizationSlug}/libraries/${libraryId}/videos/${videoId}/poster.jpg`,
        method: "GET",
        format: "blob",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Libraries
     * @name GetVideoHlsFile
     * @summary Read a playlist or segment of a processed video, for the web app's player; members play regardless of the library's playback rules
     * @request GET:/api/v1/organizations/{organizationSlug}/libraries/{libraryId}/videos/{videoId}/hls/{path}
     */
    getVideoHlsFile: (
      { organizationSlug, libraryId, videoId, path }: GetVideoHlsFileParams,
      params: RequestParams = {}
    ) =>
      this.request<File, ApiErrorResponse>({
        path: `/api/v1/organizations/${organizationSlug}/libraries/${libraryId}/videos/${videoId}/hls/${path}`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Libraries
     * @name GetVideoThumbnail
     * @summary Read a processed video's poster, storyboard image or storyboard WebVTT, for the web app's player
     * @request GET:/api/v1/organizations/{organizationSlug}/libraries/{libraryId}/videos/{videoId}/thumbnails/{fileName}
     */
    getVideoThumbnail: (
      {
        organizationSlug,
        libraryId,
        videoId,
        fileName,
      }: GetVideoThumbnailParams,
      params: RequestParams = {}
    ) =>
      this.request<Blob, ApiErrorResponse>({
        path: `/api/v1/organizations/${organizationSlug}/libraries/${libraryId}/videos/${videoId}/thumbnails/${fileName}`,
        method: "GET",
        format: "blob",
        ...params,
      }),
  }
  analytics = {
    /**
     * No description
     *
     * @tags Analytics
     * @name GetLibraryAnalytics
     * @summary Read the library's views and watch time over the last `days`
     * @request GET:/api/v1/organizations/{organizationSlug}/libraries/{libraryId}/analytics
     */
    getLibraryAnalytics: (
      { organizationSlug, libraryId, ...query }: GetLibraryAnalyticsParams,
      params: RequestParams = {}
    ) =>
      this.request<LibraryAnalyticsSuccessResponse, ApiErrorResponse>({
        path: `/api/v1/organizations/${organizationSlug}/libraries/${libraryId}/analytics`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Analytics
     * @name GetVideoAnalytics
     * @summary Read a video's views, watch time and retention over the last `days`
     * @request GET:/api/v1/organizations/{organizationSlug}/libraries/{libraryId}/videos/{videoId}/analytics
     */
    getVideoAnalytics: (
      {
        organizationSlug,
        libraryId,
        videoId,
        ...query
      }: GetVideoAnalyticsParams,
      params: RequestParams = {}
    ) =>
      this.request<VideoAnalyticsSuccessResponse, ApiErrorResponse>({
        path: `/api/v1/organizations/${organizationSlug}/libraries/${libraryId}/videos/${videoId}/analytics`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Analytics
     * @name StartVideoView
     * @summary Start counting a view when the player starts playing; signed libraries need `key`, `expires` and `token`
     * @request POST:/api/v1/libraries/{libraryId}/videos/{videoId}/views
     */
    startVideoView: (
      { libraryId, videoId, ...query }: StartVideoViewParams,
      data: VideoViewStartBody,
      params: RequestParams = {}
    ) =>
      this.request<VideoViewSuccessResponse, ApiErrorResponse>({
        path: `/api/v1/libraries/${libraryId}/videos/${videoId}/views`,
        method: "POST",
        query: query,
        body: data,
        type: "application/json",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Analytics
     * @name ReportVideoViewProgress
     * @summary Report the seconds watched since the last report and the current position
     * @request POST:/api/v1/libraries/{libraryId}/videos/{videoId}/views/{viewId}/progress
     */
    reportVideoViewProgress: (
      { libraryId, videoId, viewId }: ReportVideoViewProgressParams,
      data: VideoViewProgressBody,
      params: RequestParams = {}
    ) =>
      this.request<VideoViewProgressSuccessResponse, ApiErrorResponse>({
        path: `/api/v1/libraries/${libraryId}/videos/${videoId}/views/${viewId}/progress`,
        method: "POST",
        body: data,
        type: "application/json",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Analytics
     * @name GetOrganizationAnalytics
     * @summary Read the views and watch time of all the organization's libraries over the last `days`
     * @request GET:/api/v1/organizations/{organizationSlug}/analytics
     */
    getOrganizationAnalytics: (
      { organizationSlug, ...query }: GetOrganizationAnalyticsParams,
      params: RequestParams = {}
    ) =>
      this.request<OrganizationAnalyticsSuccessResponse, ApiErrorResponse>({
        path: `/api/v1/organizations/${organizationSlug}/analytics`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),
  }
  libraryApi = {
    /**
     * No description
     *
     * @tags Library API
     * @name GetLibraryApiVideoEmbed
     * @summary Read what the embeddable player needs; the `Referer` is the page that frames it, and signed libraries need `key`, `expires` and `token`
     * @request GET:/api/v1/libraries/{libraryId}/videos/{videoId}/embed
     */
    getLibraryApiVideoEmbed: (
      { libraryId, videoId, ...query }: GetLibraryApiVideoEmbedParams,
      params: RequestParams = {}
    ) =>
      this.request<VideoEmbedSuccessResponse, ApiErrorResponse>({
        path: `/api/v1/libraries/${libraryId}/videos/${videoId}/embed`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Library API
     * @name StreamLibraryApiVideo
     * @summary Stream the uploaded file; supports `Range`, and needs `key`, `expires` and `token` when the library requires signed playback
     * @request GET:/api/v1/libraries/{libraryId}/videos/{videoId}/stream
     */
    streamLibraryApiVideo: (
      { libraryId, videoId, ...query }: StreamLibraryApiVideoParams,
      params: RequestParams = {}
    ) =>
      this.request<Blob, ApiErrorResponse>({
        path: `/api/v1/libraries/${libraryId}/videos/${videoId}/stream`,
        method: "GET",
        query: query,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Library API
     * @name ReadLibraryApiVideoHlsFile
     * @summary Play a processed video with HLS: start at `hls/master.m3u8`; its playlists pass the URL's signature on
     * @request GET:/api/v1/libraries/{libraryId}/videos/{videoId}/hls/{path}
     */
    readLibraryApiVideoHlsFile: (
      { libraryId, videoId, path, ...query }: ReadLibraryApiVideoHlsFileParams,
      params: RequestParams = {}
    ) =>
      this.request<File, ApiErrorResponse>({
        path: `/api/v1/libraries/${libraryId}/videos/${videoId}/hls/${path}`,
        method: "GET",
        query: query,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Library API
     * @name ReadLibraryApiVideoThumbnail
     * @summary Read `poster.jpg`, or the seek previews `storyboard.vtt` and `storyboard.jpg`, of a processed video
     * @request GET:/api/v1/libraries/{libraryId}/videos/{videoId}/thumbnails/{fileName}
     */
    readLibraryApiVideoThumbnail: (
      {
        libraryId,
        videoId,
        fileName,
        ...query
      }: ReadLibraryApiVideoThumbnailParams,
      params: RequestParams = {}
    ) =>
      this.request<Blob, ApiErrorResponse>({
        path: `/api/v1/libraries/${libraryId}/videos/${videoId}/thumbnails/${fileName}`,
        method: "GET",
        query: query,
        format: "blob",
        ...params,
      }),

    /**
     * @description Needs the `analytics:read` scope.
     *
     * @tags Library API
     * @name GetLibraryApiAnalytics
     * @summary Read the library's views and watch time over the last `days`
     * @request GET:/api/v1/libraries/{libraryId}/analytics
     * @secure
     */
    getLibraryApiAnalytics: (
      { libraryId, ...query }: GetLibraryApiAnalyticsParams,
      params: RequestParams = {}
    ) =>
      this.request<LibraryAnalyticsSuccessResponse, ApiErrorResponse>({
        path: `/api/v1/libraries/${libraryId}/analytics`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Needs the `analytics:read` scope.
     *
     * @tags Library API
     * @name GetLibraryApiVideoAnalytics
     * @summary Read a video's views, watch time and retention over the last `days`
     * @request GET:/api/v1/libraries/{libraryId}/videos/{videoId}/analytics
     * @secure
     */
    getLibraryApiVideoAnalytics: (
      { libraryId, videoId, ...query }: GetLibraryApiVideoAnalyticsParams,
      params: RequestParams = {}
    ) =>
      this.request<VideoAnalyticsSuccessResponse, ApiErrorResponse>({
        path: `/api/v1/libraries/${libraryId}/videos/${videoId}/analytics`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Needs the `videos:read` scope.
     *
     * @tags Library API
     * @name ListLibraryApiVideos
     * @summary List and search the library's videos, newest first
     * @request GET:/api/v1/libraries/{libraryId}/videos
     * @secure
     */
    listLibraryApiVideos: (
      { libraryId, ...query }: ListLibraryApiVideosParams,
      params: RequestParams = {}
    ) =>
      this.request<VideoPageSuccessResponse, ApiErrorResponse>({
        path: `/api/v1/libraries/${libraryId}/videos`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Needs the `videos:upload` scope.
     *
     * @tags Library API
     * @name CreateLibraryApiVideo
     * @summary Create a draft video; upload its file to `/videos/{videoId}/uploads` with tus
     * @request POST:/api/v1/libraries/{libraryId}/videos
     * @secure
     */
    createLibraryApiVideo: (
      { libraryId }: CreateLibraryApiVideoParams,
      data: VideoCreateBody,
      params: RequestParams = {}
    ) =>
      this.request<VideoSuccessResponse, ApiErrorResponse>({
        path: `/api/v1/libraries/${libraryId}/videos`,
        method: "POST",
        body: data,
        secure: true,
        type: "application/json",
        format: "json",
        ...params,
      }),

    /**
     * @description Needs the `videos:read` scope.
     *
     * @tags Library API
     * @name GetLibraryApiVideo
     * @summary Read a video and its upload state
     * @request GET:/api/v1/libraries/{libraryId}/videos/{videoId}
     * @secure
     */
    getLibraryApiVideo: (
      { libraryId, videoId }: GetLibraryApiVideoParams,
      params: RequestParams = {}
    ) =>
      this.request<VideoSuccessResponse, ApiErrorResponse>({
        path: `/api/v1/libraries/${libraryId}/videos/${videoId}`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Needs the `videos:manage` scope.
     *
     * @tags Library API
     * @name UpdateLibraryApiVideo
     * @summary Rename a video
     * @request PATCH:/api/v1/libraries/{libraryId}/videos/{videoId}
     * @secure
     */
    updateLibraryApiVideo: (
      { libraryId, videoId }: UpdateLibraryApiVideoParams,
      data: VideoUpdateBody,
      params: RequestParams = {}
    ) =>
      this.request<VideoSuccessResponse, ApiErrorResponse>({
        path: `/api/v1/libraries/${libraryId}/videos/${videoId}`,
        method: "PATCH",
        body: data,
        secure: true,
        type: "application/json",
        format: "json",
        ...params,
      }),

    /**
     * @description Needs the `videos:manage` scope.
     *
     * @tags Library API
     * @name DeleteLibraryApiVideo
     * @summary Delete a video and its stored file
     * @request DELETE:/api/v1/libraries/{libraryId}/videos/{videoId}
     * @secure
     */
    deleteLibraryApiVideo: (
      { libraryId, videoId }: DeleteLibraryApiVideoParams,
      params: RequestParams = {}
    ) =>
      this.request<LibraryEmptySuccessResponse, ApiErrorResponse>({
        path: `/api/v1/libraries/${libraryId}/videos/${videoId}`,
        method: "DELETE",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Needs the `videos:read` scope. The same shape as the `data` of `video.processing.*` webhook events, for polling instead of, or alongside, a webhook.
     *
     * @tags Library API
     * @name GetLibraryApiVideoStatus
     * @summary Read where a video is in uploading and processing
     * @request GET:/api/v1/libraries/{libraryId}/videos/{videoId}/status
     * @secure
     */
    getLibraryApiVideoStatus: (
      { libraryId, videoId }: GetLibraryApiVideoStatusParams,
      params: RequestParams = {}
    ) =>
      this.request<VideoStatusSuccessResponse, ApiErrorResponse>({
        path: `/api/v1/libraries/${libraryId}/videos/${videoId}/status`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Needs the `playback:sign` scope.
     *
     * @tags Library API
     * @name CreateLibraryApiPlaybackUrl
     * @summary Sign a stream URL that expires; required when the library only allows signed playback
     * @request POST:/api/v1/libraries/{libraryId}/videos/{videoId}/playback-urls
     * @secure
     */
    createLibraryApiPlaybackUrl: (
      { libraryId, videoId }: CreateLibraryApiPlaybackUrlParams,
      data: PlaybackUrlCreateBody,
      params: RequestParams = {}
    ) =>
      this.request<PlaybackUrlSuccessResponse, ApiErrorResponse>({
        path: `/api/v1/libraries/${libraryId}/videos/${videoId}/playback-urls`,
        method: "POST",
        body: data,
        secure: true,
        type: "application/json",
        format: "json",
        ...params,
      }),

    /**
     * @description Needs the `videos:manage` scope.
     *
     * @tags Library API
     * @name ReprocessLibraryApiVideo
     * @summary Transcode a processed or failed video again, with the library's current qualities
     * @request POST:/api/v1/libraries/{libraryId}/videos/{videoId}/reprocess
     * @secure
     */
    reprocessLibraryApiVideo: (
      { libraryId, videoId }: ReprocessLibraryApiVideoParams,
      params: RequestParams = {}
    ) =>
      this.request<VideoSuccessResponse, ApiErrorResponse>({
        path: `/api/v1/libraries/${libraryId}/videos/${videoId}/reprocess`,
        method: "POST",
        secure: true,
        format: "json",
        ...params,
      }),
  }
  activity = {
    /**
     * No description
     *
     * @tags Activity
     * @name ListOrganizationActivity
     * @summary List who changed what in the organization, newest first, a page at a time; readable while it is pending deletion
     * @request GET:/api/v1/organizations/{organizationSlug}/activity
     */
    listOrganizationActivity: (
      { organizationSlug, ...query }: ListOrganizationActivityParams,
      params: RequestParams = {}
    ) =>
      this.request<ActivityLogPageSuccessResponse, ApiErrorResponse>({
        path: `/api/v1/organizations/${organizationSlug}/activity`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Activity
     * @name ListAccountActivity
     * @summary List the signed-in member's sign-ins, failed sign-ins and other account activity, newest first
     * @request GET:/api/v1/account/activity
     */
    listAccountActivity: (
      query: ListAccountActivityParams = {},
      params: RequestParams = {}
    ) =>
      this.request<ActivityLogPageSuccessResponse, ApiErrorResponse>({
        path: `/api/v1/account/activity`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),
  }
}
