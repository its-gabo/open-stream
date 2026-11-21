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
  | "transcription_provider.created"
  | "transcription_provider.updated"
  | "transcription_provider.deleted"
  | "chapter_generation_provider.created"
  | "chapter_generation_provider.updated"
  | "chapter_generation_provider.deleted"
  | "library.created"
  | "library.updated"
  | "library.storage_changed"
  | "library.encoding_updated"
  | "library.security_updated"
  | "library.player_updated"
  | "library.transcription_updated"
  | "library.chapter_generation_updated"
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
  | "video.poster_updated"
  | "video.chapters_updated"
  | "video.cta_created"
  | "video.cta_updated"
  | "video.cta_deleted"
  | "video.caption_uploaded"
  | "video.caption_updated"
  | "video.caption_deleted"
  | "video.transcription_requested"
  | "video.deleted"
  | "video.uploaded"
  | "video.upload_canceled"
  | "video.import_started"
  | "video.reprocess_requested"
  | "playlist.created"
  | "playlist.updated"
  | "playlist.videos_updated"
  | "playlist.deleted"
  | "lead.deleted"
  | "library.leads_exported"

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
  | "transcription_provider"
  | "chapter_generation_provider"
  | "library"
  | "api_key"
  | "webhook"
  | "video"
  | "playlist"
  | "lead"

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

export interface ChapterAnalytics {
  /**
   * @min 0
   * @max 9007199254740991
   */
  completedViews: number
  /** @min 0 */
  endSeconds: number
  /** @min 0 */
  startSeconds: number
  title: string
  /**
   * @min 0
   * @max 9007199254740991
   */
  views: number
}

export interface ChapterGenerationConnectionTest {
  isAuthorized: boolean
  isReachable: boolean
}

export interface ChapterGenerationConnectionTestSuccessResponse {
  code: string
  data: {
    connection: ChapterGenerationConnectionTest
  }
  message: string
}

export interface ChapterGenerationProvider {
  apiKeyHint: string | null
  /** @format uri */
  baseUrl: string
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
  kind: ChapterGenerationProviderKind
  /**
   * @min 0
   * @max 9007199254740991
   */
  libraryCount: number
  model: string
  monthlyTokenLimit: number | null
  name: string
  /**
   * @min 0
   * @max 9007199254740991
   */
  tokensUsedThisMonth: number
  /**
   * @format date-time
   * @pattern ^(?:(?:\d\d[2468][048]|\d\d[13579][26]|\d\d0[48]|[02468][048]00|[13579][26]00)-02-29|\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\d|30)|(?:02)-(?:0[1-9]|1\d|2[0-8])))T(?:(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d+)?(?:Z))$
   */
  updatedAt: string
}

export type ChapterGenerationProviderCreateBody =
  | {
      /**
       * @minLength 1
       * @maxLength 512
       */
      apiKey: string
      kind: "openai"
      /**
       * @minLength 1
       * @maxLength 120
       * @default "gpt-6-luna"
       */
      model?: string
      /** @default null */
      monthlyTokenLimit?: number | null
      /**
       * @minLength 1
       * @maxLength 80
       */
      name: string
    }
  | {
      apiKey: string | null
      /** @maxLength 2048 */
      baseUrl: string
      kind: "openai_compatible"
      /**
       * @minLength 1
       * @maxLength 120
       * @default "gpt-6-luna"
       */
      model?: string
      /** @default null */
      monthlyTokenLimit?: number | null
      /**
       * @minLength 1
       * @maxLength 80
       */
      name: string
    }

export type ChapterGenerationProviderKind = "openai" | "openai_compatible"

export interface ChapterGenerationProviderListSuccessResponse {
  code: string
  data: {
    providers: ChapterGenerationProvider[]
  }
  message: string
}

export interface ChapterGenerationProviderSuccessResponse {
  code: string
  data: {
    provider: ChapterGenerationProvider
  }
  message: string
}

export interface ChapterGenerationProviderUpdateBody {
  apiKey?: string | null
  baseUrl?: string | null
  /**
   * @minLength 1
   * @maxLength 120
   */
  model: string
  monthlyTokenLimit?: number | null
  /**
   * @minLength 1
   * @maxLength 80
   */
  name: string
}

export interface CreateChapterGenerationProviderParams {
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

export interface CreateLibraryApiPlaylistParams {
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  libraryId: string
}

export interface CreateLibraryApiPlaylistPlaybackUrlParams {
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  libraryId: string
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  playlistId: string
}

export interface CreateLibraryApiVideoCtaParams {
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

export interface CreatePlaylistParams {
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  libraryId: string
  organizationSlug: string
}

export interface CreateStorageParams {
  organizationSlug: string
}

export interface CreateTranscriptionProviderParams {
  organizationSlug: string
}

export interface CreateVideoCtaParams {
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

export interface CreateVideoParams {
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  libraryId: string
  organizationSlug: string
}

export interface CtaAnalytics {
  /**
   * @min 0
   * @max 9007199254740991
   */
  clickedViews: number
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  ctaId: string
  /**
   * @min 0
   * @max 9007199254740991
   */
  dismissedViews: number
  heading: string
  kind: "button" | "email"
  placement: "overlay" | "end_screen"
  /**
   * @min 0
   * @max 9007199254740991
   */
  shownViews: number
  /**
   * @min 0
   * @max 9007199254740991
   */
  submittedViews: number
}

export interface DeclineOrganizationInvitationParams {
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  invitationId: string
}

export interface DeleteChapterGenerationProviderParams {
  organizationSlug: string
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  providerId: string
}

export interface DeleteLeadParams {
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  leadId: string
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  libraryId: string
  organizationSlug: string
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

export interface DeleteLibraryApiPlaylistParams {
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  libraryId: string
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  playlistId: string
}

export interface DeleteLibraryApiVideoCaptionParams {
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  captionId: string
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

export interface DeleteLibraryApiVideoCtaParams {
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  ctaId: string
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

export interface DeletePlaylistParams {
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
  playlistId: string
}

export interface DeleteStorageParams {
  organizationSlug: string
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  storageId: string
}

export interface DeleteTranscriptionProviderParams {
  organizationSlug: string
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  providerId: string
}

export interface DeleteVideoCaptionParams {
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  captionId: string
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

export interface DeleteVideoCtaParams {
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  ctaId: string
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

export interface ExportLeadsParams {
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
  videoId?: string
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

export interface GetLibraryApiPlaylistEmbedParams {
  expires?: string
  key?: string
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  libraryId: string
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  playlistId: string
  token?: string
}

export interface GetLibraryApiPlaylistParams {
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  libraryId: string
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  playlistId: string
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

export interface GetLibraryApiVideoEmbedCaptionsParams {
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

export interface GetLibraryApiVideoEmbedCtasParams {
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

export interface GetLibraryChapterGenerationSettingsParams {
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  libraryId: string
  organizationSlug: string
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

export interface GetLibraryPlayerParams {
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

export interface GetLibraryTranscriptionSettingsParams {
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

export interface GetPlaylistParams {
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
  playlistId: string
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

export interface GetVideoCaptionFileParams {
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  captionId: string
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

export interface ImportLibraryApiVideoParams {
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

export interface ImportVideoParams {
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
    | "leads:read"
  )[]
}

export type LibraryApiKeyScope =
  | "videos:read"
  | "videos:upload"
  | "videos:manage"
  | "playback:sign"
  | "analytics:read"
  | "leads:read"

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
    | "leads:read"
  )[]
}

export interface LibraryChapterGenerationSettings {
  providerId: string | null
}

export interface LibraryChapterGenerationSettingsSuccessResponse {
  code: string
  data: {
    chapterGeneration: LibraryChapterGenerationSettings
  }
  message: string
}

export interface LibraryChapterGenerationUpdateBody {
  providerId: string | null
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

export interface LibraryPlayerSettings {
  /** @pattern ^#[0-9a-f]{6}$ */
  accentColor: string
  autoplayNext: boolean
  showCaptions: boolean
  showChapters: boolean
  showFullscreen: boolean
  showPictureInPicture: boolean
  showSettingsMenu: boolean
  showTitle: boolean
}

export interface LibraryPlayerSuccessResponse {
  code: string
  data: {
    player: LibraryPlayerSettings
  }
  message: string
}

export interface LibraryPlayerUpdateBody {
  /** @pattern ^#[0-9a-f]{6}$ */
  accentColor: string
  autoplayNext: boolean
  showCaptions: boolean
  showChapters: boolean
  showFullscreen: boolean
  showPictureInPicture: boolean
  showSettingsMenu: boolean
  showTitle: boolean
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

export interface LibraryTranscriptionSettings {
  autoTranscribe: boolean
  language: string | null
  providerId: string | null
}

export interface LibraryTranscriptionSettingsSuccessResponse {
  code: string
  data: {
    transcription: LibraryTranscriptionSettings
  }
  message: string
}

export interface LibraryTranscriptionUpdateBody {
  autoTranscribe: boolean
  language: string | null
  providerId: string | null
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

export interface ListChapterGenerationProvidersParams {
  organizationSlug: string
}

export interface ListLeadsParams {
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
  /** @maxLength 100 */
  search?: string
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  videoId?: string
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

export interface ListLibraryApiLeadsParams {
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
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  videoId?: string
}

export interface ListLibraryApiPlaylistsParams {
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  libraryId: string
}

export interface ListLibraryApiVideoCaptionsParams {
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

export interface ListLibraryApiVideoCtasParams {
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

export interface ListPlaylistsParams {
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  libraryId: string
  organizationSlug: string
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

export interface ListTranscriptionProvidersParams {
  organizationSlug: string
}

export interface ListVideoCaptionsParams {
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

export interface ListVideoCtasParams {
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
  captionsUrl: string
  /** @format uri */
  chaptersUrl: string
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

export interface Playlist {
  /**
   * @format date-time
   * @pattern ^(?:(?:\d\d[2468][048]|\d\d[13579][26]|\d\d0[48]|[02468][048]00|[13579][26]00)-02-29|\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\d|30)|(?:02)-(?:0[1-9]|1\d|2[0-8])))T(?:(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d+)?(?:Z))$
   */
  createdAt: string
  description: string | null
  /** @min 0 */
  durationSeconds: number
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
  title: string
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
  videos: Video[]
}

export interface PlaylistCreateBody {
  description?: string | null
  /**
   * @minLength 1
   * @maxLength 200
   */
  title: string
  /** @maxItems 50 */
  videoIds?: string[]
}

export interface PlaylistEmbed {
  allowedPlaybackHosts: string[]
  description: string | null
  player: LibraryPlayerSettings
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  playlistId: string
  title: string
  videos: PlaylistEmbedVideo[]
}

export interface PlaylistEmbedSuccessResponse {
  code: string
  data: {
    embed: PlaylistEmbed
  }
  message: string
}

export interface PlaylistEmbedVideo {
  /** @format uri */
  captionsUrl: string
  chapters: VideoChapter[]
  /** @format uri */
  ctasUrl: string
  description: string | null
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

export interface PlaylistListSuccessResponse {
  code: string
  data: {
    playlists: PlaylistSummary[]
  }
  message: string
}

export interface PlaylistPlaybackUrl {
  /** @format uri */
  embedUrl: string
  /**
   * @format date-time
   * @pattern ^(?:(?:\d\d[2468][048]|\d\d[13579][26]|\d\d0[48]|[02468][048]00|[13579][26]00)-02-29|\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\d|30)|(?:02)-(?:0[1-9]|1\d|2[0-8])))T(?:(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d+)?(?:Z))$
   */
  expiresAt: string
}

export interface PlaylistPlaybackUrlSuccessResponse {
  code: string
  data: {
    playback: PlaylistPlaybackUrl
  }
  message: string
}

export interface PlaylistSuccessResponse {
  code: string
  data: {
    playlist: Playlist
  }
  message: string
}

export interface PlaylistSummary {
  /**
   * @format date-time
   * @pattern ^(?:(?:\d\d[2468][048]|\d\d[13579][26]|\d\d0[48]|[02468][048]00|[13579][26]00)-02-29|\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\d|30)|(?:02)-(?:0[1-9]|1\d|2[0-8])))T(?:(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d+)?(?:Z))$
   */
  createdAt: string
  description: string | null
  /** @min 0 */
  durationSeconds: number
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
  title: string
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

export interface PlaylistUpdateBody {
  description?: string | null
  /**
   * @minLength 1
   * @maxLength 200
   */
  title?: string
}

export interface PlaylistVideosUpdateBody {
  /** @maxItems 50 */
  videoIds: string[]
}

export interface ReadLibraryApiVideoCaptionFileParams {
  expires?: string
  /** @pattern ^[0-9a-f-]{36}\.vtt$ */
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

export interface ReadLibraryApiVideoChaptersParams {
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

export interface ReportVideoCtaEventParams {
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  ctaId: string
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

export interface RequestLibraryApiVideoTranscriptionParams {
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

export interface RequestVideoTranscriptionParams {
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

export interface SubmitVideoCtaLeadParams {
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  ctaId: string
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

export interface SuggestOrganizationSlugParams {
  /**
   * @minLength 1
   * @maxLength 120
   */
  name: string
}

export interface SuggestVideoChaptersParams {
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

export interface TestChapterGenerationProviderParams {
  organizationSlug: string
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  providerId: string
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

export interface TestTranscriptionProviderParams {
  organizationSlug: string
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  providerId: string
}

export interface TranscriptionConnectionTest {
  isAuthorized: boolean
  isReachable: boolean
}

export interface TranscriptionConnectionTestSuccessResponse {
  code: string
  data: {
    connection: TranscriptionConnectionTest
  }
  message: string
}

export interface TranscriptionProvider {
  apiKeyHint: string | null
  /** @format uri */
  baseUrl: string
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
  kind: TranscriptionProviderKind
  /**
   * @min 0
   * @max 9007199254740991
   */
  libraryCount: number
  model: string
  monthlyMinuteLimit: number | null
  name: string
  /**
   * @format date-time
   * @pattern ^(?:(?:\d\d[2468][048]|\d\d[13579][26]|\d\d0[48]|[02468][048]00|[13579][26]00)-02-29|\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\d|30)|(?:02)-(?:0[1-9]|1\d|2[0-8])))T(?:(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d+)?(?:Z))$
   */
  updatedAt: string
  /** @min 0 */
  usedMinutesThisMonth: number
}

export type TranscriptionProviderCreateBody =
  | {
      /**
       * @minLength 1
       * @maxLength 512
       */
      apiKey: string
      kind: "openai"
      /**
       * @minLength 1
       * @maxLength 120
       */
      model: string
      /** @default null */
      monthlyMinuteLimit?: number | null
      /**
       * @minLength 1
       * @maxLength 80
       */
      name: string
    }
  | {
      apiKey: string | null
      /** @maxLength 2048 */
      baseUrl: string
      kind: "openai_compatible"
      /**
       * @minLength 1
       * @maxLength 120
       */
      model: string
      /** @default null */
      monthlyMinuteLimit?: number | null
      /**
       * @minLength 1
       * @maxLength 80
       */
      name: string
    }

export type TranscriptionProviderKind = "openai" | "openai_compatible"

export interface TranscriptionProviderListSuccessResponse {
  code: string
  data: {
    providers: TranscriptionProvider[]
  }
  message: string
}

export interface TranscriptionProviderSuccessResponse {
  code: string
  data: {
    provider: TranscriptionProvider
  }
  message: string
}

export interface TranscriptionProviderUpdateBody {
  apiKey?: string | null
  baseUrl?: string | null
  /**
   * @minLength 1
   * @maxLength 120
   */
  model: string
  monthlyMinuteLimit?: number | null
  /**
   * @minLength 1
   * @maxLength 80
   */
  name: string
}

export interface TransferOrganizationOwnershipParams {
  organizationSlug: string
}

export interface UpdateChapterGenerationProviderParams {
  organizationSlug: string
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  providerId: string
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

export interface UpdateLibraryApiPlaylistParams {
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  libraryId: string
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  playlistId: string
}

export interface UpdateLibraryApiPlaylistVideosParams {
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  libraryId: string
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  playlistId: string
}

export interface UpdateLibraryApiVideoCaptionParams {
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  captionId: string
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

export interface UpdateLibraryApiVideoChaptersParams {
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

export interface UpdateLibraryApiVideoCtaParams {
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  ctaId: string
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

export interface UpdateLibraryApiVideoPosterParams {
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

export interface UpdateLibraryChapterGenerationSettingsParams {
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  libraryId: string
  organizationSlug: string
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

export interface UpdateLibraryPlayerParams {
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

export interface UpdateLibraryTranscriptionSettingsParams {
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

export interface UpdatePlaylistParams {
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
  playlistId: string
}

export interface UpdatePlaylistVideosParams {
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
  playlistId: string
}

export interface UpdateStorageParams {
  organizationSlug: string
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  storageId: string
}

export interface UpdateTranscriptionProviderParams {
  organizationSlug: string
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  providerId: string
}

export interface UpdateVideoCaptionParams {
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  captionId: string
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

export interface UpdateVideoChaptersParams {
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

export interface UpdateVideoCtaParams {
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  ctaId: string
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

export interface UpdateVideoPosterParams {
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

export interface UploadLibraryApiVideoCaptionParams {
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

export interface UploadLibraryApiVideoPosterImageParams {
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

export interface UploadVideoCaptionParams {
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

export interface UploadVideoPosterImageParams {
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
  chapters: VideoChapter[]
  /**
   * @format date-time
   * @pattern ^(?:(?:\d\d[2468][048]|\d\d[13579][26]|\d\d0[48]|[02468][048]00|[13579][26]00)-02-29|\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\d|30)|(?:02)-(?:0[1-9]|1\d|2[0-8])))T(?:(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d+)?(?:Z))$
   */
  createdAt: string
  description: string | null
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
  importHost: string | null
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  libraryId: string
  poster: VideoPoster
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
  chapters: ChapterAnalytics[]
  ctas: CtaAnalytics[]
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

export interface VideoCaption {
  /**
   * @format date-time
   * @pattern ^(?:(?:\d\d[2468][048]|\d\d[13579][26]|\d\d0[48]|[02468][048]00|[13579][26]00)-02-29|\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\d|30)|(?:02)-(?:0[1-9]|1\d|2[0-8])))T(?:(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d+)?(?:Z))$
   */
  createdAt: string
  /**
   * @exclusiveMin 0
   * @max 9007199254740991
   */
  cueCount: number
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  id: string
  isDefault: boolean
  kind: VideoCaptionKind
  label: string
  language: string
  /**
   * @exclusiveMin 0
   * @max 9007199254740991
   */
  sizeBytes: number
  source: VideoCaptionSource
  transcriptionId: string | null
  /**
   * @format date-time
   * @pattern ^(?:(?:\d\d[2468][048]|\d\d[13579][26]|\d\d0[48]|[02468][048]00|[13579][26]00)-02-29|\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\d|30)|(?:02)-(?:0[1-9]|1\d|2[0-8])))T(?:(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d+)?(?:Z))$
   */
  updatedAt: string
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  videoId: string
}

export type VideoCaptionKind = "subtitles" | "captions"

export interface VideoCaptionListSuccessResponse {
  code: string
  data: {
    captions: VideoCaption[]
    transcriptions: VideoTranscription[]
  }
  message: string
}

export type VideoCaptionSource = "upload" | "transcription"

export interface VideoCaptionSuccessResponse {
  code: string
  data: {
    caption: VideoCaption
  }
  message: string
}

export interface VideoCaptionUpdateBody {
  isDefault: boolean
  /**
   * @minLength 1
   * @maxLength 60
   */
  label: string
}

export interface VideoCaptionUploadBody {
  /** @format binary */
  file: File
  /** @default "subtitles" */
  kind?: "subtitles" | "captions"
  /**
   * @minLength 1
   * @maxLength 60
   */
  label: string
  language: string
}

export interface VideoChapter {
  /** @min 0 */
  startSeconds: number
  title: string
}

export interface VideoChapterSuggestionRequestBody {
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  captionId: string
}

export interface VideoChapterSuggestionsSuccessResponse {
  code: string
  data: {
    chapters: VideoChapter[]
  }
  message: string
}

export interface VideoChaptersUpdateBody {
  /** @maxItems 50 */
  chapters: {
    /** @min 0 */
    startSeconds: number
    /**
     * @minLength 1
     * @maxLength 100
     */
    title: string
  }[]
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

export interface VideoCta {
  body: string | null
  buttonLabel: string
  buttonUrl: string | null
  consentText: string | null
  /**
   * @format date-time
   * @pattern ^(?:(?:\d\d[2468][048]|\d\d[13579][26]|\d\d0[48]|[02468][048]00|[13579][26]00)-02-29|\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\d|30)|(?:02)-(?:0[1-9]|1\d|2[0-8])))T(?:(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d+)?(?:Z))$
   */
  createdAt: string
  dismissible: boolean
  durationSeconds: number | null
  endSeconds: number | null
  heading: string
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  id: string
  kind: VideoCtaKind
  placement: VideoCtaPlacement
  startSeconds: number | null
  timing: VideoCtaTiming
  /**
   * @format date-time
   * @pattern ^(?:(?:\d\d[2468][048]|\d\d[13579][26]|\d\d0[48]|[02468][048]00|[13579][26]00)-02-29|\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\d|30)|(?:02)-(?:0[1-9]|1\d|2[0-8])))T(?:(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d+)?(?:Z))$
   */
  updatedAt: string
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  videoId: string
}

export interface VideoCtaBody {
  body: string | null
  /**
   * @minLength 1
   * @maxLength 30
   */
  buttonLabel: string
  buttonUrl: string | null
  consentText: string | null
  dismissible: boolean
  durationSeconds?: number | null
  endSeconds: number | null
  /**
   * @minLength 1
   * @maxLength 80
   */
  heading: string
  kind: "button" | "email"
  placement: "overlay" | "end_screen"
  startSeconds: number | null
  /** @default "fixed" */
  timing?: "fixed" | "random"
}

export interface VideoCtaEventBody {
  type: "shown" | "clicked" | "dismissed"
}

export type VideoCtaKind = "button" | "email"

export interface VideoCtaLead {
  consentText: string
  /**
   * @format date-time
   * @pattern ^(?:(?:\d\d[2468][048]|\d\d[13579][26]|\d\d0[48]|[02468][048]00|[13579][26]00)-02-29|\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\d|30)|(?:02)-(?:0[1-9]|1\d|2[0-8])))T(?:(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d+)?(?:Z))$
   */
  consentedAt: string
  ctaHeading: string
  ctaId: string | null
  email: string
  embeddingHost: string | null
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
  videoId: string | null
  videoTitle: string
}

export interface VideoCtaLeadBody {
  consent: true
  /** @maxLength 254 */
  email: string
}

export interface VideoCtaLeadPageSuccessResponse {
  code: string
  data: {
    leads: VideoCtaLead[]
    pagination: Pagination
  }
  message: string
}

export interface VideoCtaListSuccessResponse {
  code: string
  data: {
    ctas: VideoCta[]
  }
  message: string
}

export type VideoCtaPlacement = "overlay" | "end_screen"

export interface VideoCtaSuccessResponse {
  code: string
  data: {
    cta: VideoCta
  }
  message: string
}

export type VideoCtaTiming = "fixed" | "random"

export interface VideoEmbed {
  allowedPlaybackHosts: string[]
  /** @format uri */
  captionsUrl: string
  chapters: VideoChapter[]
  /** @format uri */
  ctasUrl: string
  description: string | null
  /** @min 0 */
  durationSeconds: number
  /**
   * @exclusiveMin 0
   * @max 9007199254740991
   */
  height: number
  /** @format uri */
  hlsUrl: string
  player: LibraryPlayerSettings
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

export interface VideoEmbedCaption {
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  id: string
  isDefault: boolean
  kind: VideoCaptionKind
  label: string
  language: string
  /** @format uri */
  url: string
}

export interface VideoEmbedCaptionListSuccessResponse {
  code: string
  data: {
    captions: VideoEmbedCaption[]
  }
  message: string
}

export interface VideoEmbedCta {
  body: string | null
  buttonLabel: string
  buttonUrl: string | null
  consentText: string | null
  dismissible: boolean
  durationSeconds: number | null
  endSeconds: number | null
  heading: string
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  id: string
  kind: VideoCtaKind
  placement: VideoCtaPlacement
  startSeconds: number | null
  timing: VideoCtaTiming
}

export interface VideoEmbedCtaListSuccessResponse {
  code: string
  data: {
    ctas: VideoEmbedCta[]
  }
  message: string
}

export interface VideoEmbedSuccessResponse {
  code: string
  data: {
    embed: VideoEmbed
  }
  message: string
}

export type VideoFailureReason =
  | "invalid_file_type"
  | "import_unreachable"
  | "import_too_large"
  | "import_timed_out"
  | "import_failed"

export type VideoFileFormat = "mp4" | "mov"

export interface VideoImportBody {
  /** @maxLength 2048 */
  url: string
}

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

export interface VideoPoster {
  frameSeconds: number | null
  source: VideoPosterSource
  updatedAt: string | null
}

export interface VideoPosterImageBody {
  /** @format binary */
  image: File
}

export type VideoPosterSource = "automatic" | "frame" | "image"

export type VideoPosterUpdateBody =
  | {
      source: "automatic"
    }
  | {
      /** @min 0 */
      atSeconds: number
      source: "frame"
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

export interface VideoTranscription {
  /**
   * @format date-time
   * @pattern ^(?:(?:\d\d[2468][048]|\d\d[13579][26]|\d\d0[48]|[02468][048]00|[13579][26]00)-02-29|\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\d|30)|(?:02)-(?:0[1-9]|1\d|2[0-8])))T(?:(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d+)?(?:Z))$
   */
  createdAt: string
  detectedLanguage: string | null
  failureReason: VideoTranscriptionFailureReason | null
  finishedAt: string | null
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  id: string
  kind: VideoCaptionKind
  language: string | null
  model: string
  providerId: string | null
  providerName: string | null
  status: VideoTranscriptionStatus
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  videoId: string
}

export type VideoTranscriptionFailureReason =
  | "provider_auth"
  | "provider_rejected"
  | "provider_unreachable"
  | "provider_removed"
  | "no_audio"
  | "no_speech"
  | "usage_limit_reached"
  | "transcription_failed"

export interface VideoTranscriptionRequestBody {
  /** @default "subtitles" */
  kind?: "subtitles" | "captions"
  language?: string | null
}

export type VideoTranscriptionStatus =
  "pending" | "processing" | "succeeded" | "failed"

export interface VideoTranscriptionSuccessResponse {
  code: string
  data: {
    transcription: VideoTranscription
  }
  message: string
}

export interface VideoUpdateBody {
  description?: string | null
  /**
   * @minLength 1
   * @maxLength 200
   */
  title?: string
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
  data:
    | VideoStatusDetails
    | VideoCtaLead
    | VideoCaption
    | VideoTranscription
    | WebhookTestEventData
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
  | "video.caption.ready"
  | "video.caption.deleted"
  | "video.transcription.failed"
  | "video.cta.submitted"
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
  transcriptionProviders = {
    /**
     * No description
     *
     * @tags Transcription providers
     * @name ListTranscriptionProviders
     * @summary List the organization's transcription providers by name
     * @request GET:/api/v1/organizations/{organizationSlug}/transcription-providers
     */
    listTranscriptionProviders: (
      { organizationSlug }: ListTranscriptionProvidersParams,
      params: RequestParams = {}
    ) =>
      this.request<TranscriptionProviderListSuccessResponse, ApiErrorResponse>({
        path: `/api/v1/organizations/${organizationSlug}/transcription-providers`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Transcription providers
     * @name CreateTranscriptionProvider
     * @summary Connect OpenAI, or a server of your own speaking OpenAI's transcription API
     * @request POST:/api/v1/organizations/{organizationSlug}/transcription-providers
     */
    createTranscriptionProvider: (
      { organizationSlug }: CreateTranscriptionProviderParams,
      data: TranscriptionProviderCreateBody,
      params: RequestParams = {}
    ) =>
      this.request<TranscriptionProviderSuccessResponse, ApiErrorResponse>({
        path: `/api/v1/organizations/${organizationSlug}/transcription-providers`,
        method: "POST",
        body: data,
        type: "application/json",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Transcription providers
     * @name UpdateTranscriptionProvider
     * @summary Change a provider's name, address, model or API key; its kind stays
     * @request PUT:/api/v1/organizations/{organizationSlug}/transcription-providers/{providerId}
     */
    updateTranscriptionProvider: (
      { organizationSlug, providerId }: UpdateTranscriptionProviderParams,
      data: TranscriptionProviderUpdateBody,
      params: RequestParams = {}
    ) =>
      this.request<TranscriptionProviderSuccessResponse, ApiErrorResponse>({
        path: `/api/v1/organizations/${organizationSlug}/transcription-providers/${providerId}`,
        method: "PUT",
        body: data,
        type: "application/json",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Transcription providers
     * @name DeleteTranscriptionProvider
     * @summary Delete a provider no library uses; tracks it wrote stay
     * @request DELETE:/api/v1/organizations/{organizationSlug}/transcription-providers/{providerId}
     */
    deleteTranscriptionProvider: (
      { organizationSlug, providerId }: DeleteTranscriptionProviderParams,
      params: RequestParams = {}
    ) =>
      this.request<LibraryEmptySuccessResponse, ApiErrorResponse>({
        path: `/api/v1/organizations/${organizationSlug}/transcription-providers/${providerId}`,
        method: "DELETE",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Transcription providers
     * @name TestTranscriptionProvider
     * @summary Check a saved provider answers and takes its API key, without transcribing anything
     * @request POST:/api/v1/organizations/{organizationSlug}/transcription-providers/{providerId}/connection-tests
     */
    testTranscriptionProvider: (
      { organizationSlug, providerId }: TestTranscriptionProviderParams,
      params: RequestParams = {}
    ) =>
      this.request<
        TranscriptionConnectionTestSuccessResponse,
        ApiErrorResponse
      >({
        path: `/api/v1/organizations/${organizationSlug}/transcription-providers/${providerId}/connection-tests`,
        method: "POST",
        format: "json",
        ...params,
      }),
  }
  chapterGenerationProviders = {
    /**
     * No description
     *
     * @tags Chapter generation providers
     * @name ListChapterGenerationProviders
     * @summary List the organization's chapter generation providers by name
     * @request GET:/api/v1/organizations/{organizationSlug}/chapter-generation-providers
     */
    listChapterGenerationProviders: (
      { organizationSlug }: ListChapterGenerationProvidersParams,
      params: RequestParams = {}
    ) =>
      this.request<
        ChapterGenerationProviderListSuccessResponse,
        ApiErrorResponse
      >({
        path: `/api/v1/organizations/${organizationSlug}/chapter-generation-providers`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Chapter generation providers
     * @name CreateChapterGenerationProvider
     * @summary Connect OpenAI, or a server of your own speaking OpenAI's chat completions API, to write chapters with a model of your choice
     * @request POST:/api/v1/organizations/{organizationSlug}/chapter-generation-providers
     */
    createChapterGenerationProvider: (
      { organizationSlug }: CreateChapterGenerationProviderParams,
      data: ChapterGenerationProviderCreateBody,
      params: RequestParams = {}
    ) =>
      this.request<ChapterGenerationProviderSuccessResponse, ApiErrorResponse>({
        path: `/api/v1/organizations/${organizationSlug}/chapter-generation-providers`,
        method: "POST",
        body: data,
        type: "application/json",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Chapter generation providers
     * @name UpdateChapterGenerationProvider
     * @summary Change a provider's name, address, model or API key; its kind stays
     * @request PUT:/api/v1/organizations/{organizationSlug}/chapter-generation-providers/{providerId}
     */
    updateChapterGenerationProvider: (
      { organizationSlug, providerId }: UpdateChapterGenerationProviderParams,
      data: ChapterGenerationProviderUpdateBody,
      params: RequestParams = {}
    ) =>
      this.request<ChapterGenerationProviderSuccessResponse, ApiErrorResponse>({
        path: `/api/v1/organizations/${organizationSlug}/chapter-generation-providers/${providerId}`,
        method: "PUT",
        body: data,
        type: "application/json",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Chapter generation providers
     * @name DeleteChapterGenerationProvider
     * @summary Delete a provider no library uses
     * @request DELETE:/api/v1/organizations/{organizationSlug}/chapter-generation-providers/{providerId}
     */
    deleteChapterGenerationProvider: (
      { organizationSlug, providerId }: DeleteChapterGenerationProviderParams,
      params: RequestParams = {}
    ) =>
      this.request<LibraryEmptySuccessResponse, ApiErrorResponse>({
        path: `/api/v1/organizations/${organizationSlug}/chapter-generation-providers/${providerId}`,
        method: "DELETE",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Chapter generation providers
     * @name TestChapterGenerationProvider
     * @summary Check a saved provider answers and takes its API key, without generating anything
     * @request POST:/api/v1/organizations/{organizationSlug}/chapter-generation-providers/{providerId}/connection-tests
     */
    testChapterGenerationProvider: (
      { organizationSlug, providerId }: TestChapterGenerationProviderParams,
      params: RequestParams = {}
    ) =>
      this.request<
        ChapterGenerationConnectionTestSuccessResponse,
        ApiErrorResponse
      >({
        path: `/api/v1/organizations/${organizationSlug}/chapter-generation-providers/${providerId}/connection-tests`,
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
     * @name GetLibraryPlayer
     * @summary Read how the library's embedded player looks
     * @request GET:/api/v1/organizations/{organizationSlug}/libraries/{libraryId}/player
     */
    getLibraryPlayer: (
      { organizationSlug, libraryId }: GetLibraryPlayerParams,
      params: RequestParams = {}
    ) =>
      this.request<LibraryPlayerSuccessResponse, ApiErrorResponse>({
        path: `/api/v1/organizations/${organizationSlug}/libraries/${libraryId}/player`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Libraries
     * @name UpdateLibraryPlayer
     * @summary Choose the player's accent color and controls; embeds use them from their next load
     * @request PUT:/api/v1/organizations/{organizationSlug}/libraries/{libraryId}/player
     */
    updateLibraryPlayer: (
      { organizationSlug, libraryId }: UpdateLibraryPlayerParams,
      data: LibraryPlayerUpdateBody,
      params: RequestParams = {}
    ) =>
      this.request<LibraryPlayerSuccessResponse, ApiErrorResponse>({
        path: `/api/v1/organizations/${organizationSlug}/libraries/${libraryId}/player`,
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
     * @summary Change a video's title or description
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
     * @name ImportVideo
     * @summary Import a video's file from a URL instead of uploading it; the worker downloads it
     * @request POST:/api/v1/organizations/{organizationSlug}/libraries/{libraryId}/videos/{videoId}/import
     */
    importVideo: (
      { organizationSlug, libraryId, videoId }: ImportVideoParams,
      data: VideoImportBody,
      params: RequestParams = {}
    ) =>
      this.request<VideoSuccessResponse, ApiErrorResponse>({
        path: `/api/v1/organizations/${organizationSlug}/libraries/${libraryId}/videos/${videoId}/import`,
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
     * @name UpdateVideoPoster
     * @summary Take a processed video's poster from a chosen frame, or back from the automatic one
     * @request PUT:/api/v1/organizations/{organizationSlug}/libraries/{libraryId}/videos/{videoId}/poster
     */
    updateVideoPoster: (
      { organizationSlug, libraryId, videoId }: UpdateVideoPosterParams,
      data: VideoPosterUpdateBody,
      params: RequestParams = {}
    ) =>
      this.request<VideoSuccessResponse, ApiErrorResponse>({
        path: `/api/v1/organizations/${organizationSlug}/libraries/${libraryId}/videos/${videoId}/poster`,
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
     * @name UploadVideoPosterImage
     * @summary Make an uploaded JPEG, PNG or WebP image the poster of a processed video
     * @request PUT:/api/v1/organizations/{organizationSlug}/libraries/{libraryId}/videos/{videoId}/poster/image
     */
    uploadVideoPosterImage: (
      { organizationSlug, libraryId, videoId }: UploadVideoPosterImageParams,
      data: VideoPosterImageBody,
      params: RequestParams = {}
    ) =>
      this.request<VideoSuccessResponse, ApiErrorResponse>({
        path: `/api/v1/organizations/${organizationSlug}/libraries/${libraryId}/videos/${videoId}/poster/image`,
        method: "PUT",
        body: data,
        type: "multipart/form-data",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Libraries
     * @name UpdateVideoChapters
     * @summary Replace a processed video's chapters; the first starts at 0:00 and an empty list removes them
     * @request PUT:/api/v1/organizations/{organizationSlug}/libraries/{libraryId}/videos/{videoId}/chapters
     */
    updateVideoChapters: (
      { organizationSlug, libraryId, videoId }: UpdateVideoChaptersParams,
      data: VideoChaptersUpdateBody,
      params: RequestParams = {}
    ) =>
      this.request<VideoSuccessResponse, ApiErrorResponse>({
        path: `/api/v1/organizations/${organizationSlug}/libraries/${libraryId}/videos/${videoId}/chapters`,
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

    /**
     * No description
     *
     * @tags Libraries
     * @name ListPlaylists
     * @summary List the library's playlists, newest first
     * @request GET:/api/v1/organizations/{organizationSlug}/libraries/{libraryId}/playlists
     */
    listPlaylists: (
      { organizationSlug, libraryId }: ListPlaylistsParams,
      params: RequestParams = {}
    ) =>
      this.request<PlaylistListSuccessResponse, ApiErrorResponse>({
        path: `/api/v1/organizations/${organizationSlug}/libraries/${libraryId}/playlists`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Libraries
     * @name CreatePlaylist
     * @summary Create a playlist, empty or with videos of the library
     * @request POST:/api/v1/organizations/{organizationSlug}/libraries/{libraryId}/playlists
     */
    createPlaylist: (
      { organizationSlug, libraryId }: CreatePlaylistParams,
      data: PlaylistCreateBody,
      params: RequestParams = {}
    ) =>
      this.request<PlaylistSuccessResponse, ApiErrorResponse>({
        path: `/api/v1/organizations/${organizationSlug}/libraries/${libraryId}/playlists`,
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
     * @name GetPlaylist
     * @summary Read a playlist and its videos in playback order
     * @request GET:/api/v1/organizations/{organizationSlug}/libraries/{libraryId}/playlists/{playlistId}
     */
    getPlaylist: (
      { organizationSlug, libraryId, playlistId }: GetPlaylistParams,
      params: RequestParams = {}
    ) =>
      this.request<PlaylistSuccessResponse, ApiErrorResponse>({
        path: `/api/v1/organizations/${organizationSlug}/libraries/${libraryId}/playlists/${playlistId}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Libraries
     * @name UpdatePlaylist
     * @summary Change a playlist's title or description
     * @request PATCH:/api/v1/organizations/{organizationSlug}/libraries/{libraryId}/playlists/{playlistId}
     */
    updatePlaylist: (
      { organizationSlug, libraryId, playlistId }: UpdatePlaylistParams,
      data: PlaylistUpdateBody,
      params: RequestParams = {}
    ) =>
      this.request<PlaylistSuccessResponse, ApiErrorResponse>({
        path: `/api/v1/organizations/${organizationSlug}/libraries/${libraryId}/playlists/${playlistId}`,
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
     * @name DeletePlaylist
     * @summary Delete a playlist; its videos stay in the library
     * @request DELETE:/api/v1/organizations/{organizationSlug}/libraries/{libraryId}/playlists/{playlistId}
     */
    deletePlaylist: (
      { organizationSlug, libraryId, playlistId }: DeletePlaylistParams,
      params: RequestParams = {}
    ) =>
      this.request<LibraryEmptySuccessResponse, ApiErrorResponse>({
        path: `/api/v1/organizations/${organizationSlug}/libraries/${libraryId}/playlists/${playlistId}`,
        method: "DELETE",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Libraries
     * @name UpdatePlaylistVideos
     * @summary Replace a playlist's videos, in playback order; an empty list removes them
     * @request PUT:/api/v1/organizations/{organizationSlug}/libraries/{libraryId}/playlists/{playlistId}/videos
     */
    updatePlaylistVideos: (
      { organizationSlug, libraryId, playlistId }: UpdatePlaylistVideosParams,
      data: PlaylistVideosUpdateBody,
      params: RequestParams = {}
    ) =>
      this.request<PlaylistSuccessResponse, ApiErrorResponse>({
        path: `/api/v1/organizations/${organizationSlug}/libraries/${libraryId}/playlists/${playlistId}/videos`,
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
     * @name ListVideoCtas
     * @summary List a video's calls to action: overlays by when they appear, then the end screen
     * @request GET:/api/v1/organizations/{organizationSlug}/libraries/{libraryId}/videos/{videoId}/ctas
     */
    listVideoCtas: (
      { organizationSlug, libraryId, videoId }: ListVideoCtasParams,
      params: RequestParams = {}
    ) =>
      this.request<VideoCtaListSuccessResponse, ApiErrorResponse>({
        path: `/api/v1/organizations/${organizationSlug}/libraries/${libraryId}/videos/${videoId}/ctas`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Libraries
     * @name CreateVideoCta
     * @summary Add a call to action to a processed video: a button or an email form, as an overlay or the end screen
     * @request POST:/api/v1/organizations/{organizationSlug}/libraries/{libraryId}/videos/{videoId}/ctas
     */
    createVideoCta: (
      { organizationSlug, libraryId, videoId }: CreateVideoCtaParams,
      data: VideoCtaBody,
      params: RequestParams = {}
    ) =>
      this.request<VideoCtaSuccessResponse, ApiErrorResponse>({
        path: `/api/v1/organizations/${organizationSlug}/libraries/${libraryId}/videos/${videoId}/ctas`,
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
     * @name UpdateVideoCta
     * @summary Replace a call to action's fields; its view counts and leads stay with it
     * @request PUT:/api/v1/organizations/{organizationSlug}/libraries/{libraryId}/videos/{videoId}/ctas/{ctaId}
     */
    updateVideoCta: (
      { organizationSlug, libraryId, videoId, ctaId }: UpdateVideoCtaParams,
      data: VideoCtaBody,
      params: RequestParams = {}
    ) =>
      this.request<VideoCtaSuccessResponse, ApiErrorResponse>({
        path: `/api/v1/organizations/${organizationSlug}/libraries/${libraryId}/videos/${videoId}/ctas/${ctaId}`,
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
     * @name DeleteVideoCta
     * @summary Delete a call to action and its view counts; leads left in it stay
     * @request DELETE:/api/v1/organizations/{organizationSlug}/libraries/{libraryId}/videos/{videoId}/ctas/{ctaId}
     */
    deleteVideoCta: (
      { organizationSlug, libraryId, videoId, ctaId }: DeleteVideoCtaParams,
      params: RequestParams = {}
    ) =>
      this.request<LibraryEmptySuccessResponse, ApiErrorResponse>({
        path: `/api/v1/organizations/${organizationSlug}/libraries/${libraryId}/videos/${videoId}/ctas/${ctaId}`,
        method: "DELETE",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Libraries
     * @name ListLeads
     * @summary List the email addresses viewers left in the library's calls to action, newest first
     * @request GET:/api/v1/organizations/{organizationSlug}/libraries/{libraryId}/leads
     */
    listLeads: (
      { organizationSlug, libraryId, ...query }: ListLeadsParams,
      params: RequestParams = {}
    ) =>
      this.request<VideoCtaLeadPageSuccessResponse, ApiErrorResponse>({
        path: `/api/v1/organizations/${organizationSlug}/libraries/${libraryId}/leads`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Libraries
     * @name ExportLeads
     * @summary Download the library's leads, or one video's, as a CSV file; the export is recorded in the activity log
     * @request GET:/api/v1/organizations/{organizationSlug}/libraries/{libraryId}/leads/export
     */
    exportLeads: (
      { organizationSlug, libraryId, ...query }: ExportLeadsParams,
      params: RequestParams = {}
    ) =>
      this.request<File, ApiErrorResponse>({
        path: `/api/v1/organizations/${organizationSlug}/libraries/${libraryId}/leads/export`,
        method: "GET",
        query: query,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Libraries
     * @name DeleteLead
     * @summary Delete a lead for good; the activity log keeps no email address
     * @request DELETE:/api/v1/organizations/{organizationSlug}/libraries/{libraryId}/leads/{leadId}
     */
    deleteLead: (
      { organizationSlug, libraryId, leadId }: DeleteLeadParams,
      params: RequestParams = {}
    ) =>
      this.request<LibraryEmptySuccessResponse, ApiErrorResponse>({
        path: `/api/v1/organizations/${organizationSlug}/libraries/${libraryId}/leads/${leadId}`,
        method: "DELETE",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Libraries
     * @name ListVideoCaptions
     * @summary List a video's caption tracks by language, with its latest transcriptions
     * @request GET:/api/v1/organizations/{organizationSlug}/libraries/{libraryId}/videos/{videoId}/captions
     */
    listVideoCaptions: (
      { organizationSlug, libraryId, videoId }: ListVideoCaptionsParams,
      params: RequestParams = {}
    ) =>
      this.request<VideoCaptionListSuccessResponse, ApiErrorResponse>({
        path: `/api/v1/organizations/${organizationSlug}/libraries/${libraryId}/videos/${videoId}/captions`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Libraries
     * @name UploadVideoCaption
     * @summary Upload a WebVTT or SRT file as a caption track of a processed video; a track of the same language and kind is replaced
     * @request POST:/api/v1/organizations/{organizationSlug}/libraries/{libraryId}/videos/{videoId}/captions
     */
    uploadVideoCaption: (
      { organizationSlug, libraryId, videoId }: UploadVideoCaptionParams,
      data: VideoCaptionUploadBody,
      params: RequestParams = {}
    ) =>
      this.request<VideoCaptionSuccessResponse, ApiErrorResponse>({
        path: `/api/v1/organizations/${organizationSlug}/libraries/${libraryId}/videos/${videoId}/captions`,
        method: "POST",
        body: data,
        type: "multipart/form-data",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Libraries
     * @name UpdateVideoCaption
     * @summary Rename a caption track, or make it the one players turn on by themselves
     * @request PUT:/api/v1/organizations/{organizationSlug}/libraries/{libraryId}/videos/{videoId}/captions/{captionId}
     */
    updateVideoCaption: (
      {
        organizationSlug,
        libraryId,
        videoId,
        captionId,
      }: UpdateVideoCaptionParams,
      data: VideoCaptionUpdateBody,
      params: RequestParams = {}
    ) =>
      this.request<VideoCaptionSuccessResponse, ApiErrorResponse>({
        path: `/api/v1/organizations/${organizationSlug}/libraries/${libraryId}/videos/${videoId}/captions/${captionId}`,
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
     * @name DeleteVideoCaption
     * @summary Delete a caption track and its file
     * @request DELETE:/api/v1/organizations/{organizationSlug}/libraries/{libraryId}/videos/{videoId}/captions/{captionId}
     */
    deleteVideoCaption: (
      {
        organizationSlug,
        libraryId,
        videoId,
        captionId,
      }: DeleteVideoCaptionParams,
      params: RequestParams = {}
    ) =>
      this.request<LibraryEmptySuccessResponse, ApiErrorResponse>({
        path: `/api/v1/organizations/${organizationSlug}/libraries/${libraryId}/videos/${videoId}/captions/${captionId}`,
        method: "DELETE",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Libraries
     * @name GetVideoCaptionFile
     * @summary Download a caption track's WebVTT, for the web app's player and for editing it elsewhere
     * @request GET:/api/v1/organizations/{organizationSlug}/libraries/{libraryId}/videos/{videoId}/captions/{captionId}/file
     */
    getVideoCaptionFile: (
      {
        organizationSlug,
        libraryId,
        videoId,
        captionId,
      }: GetVideoCaptionFileParams,
      params: RequestParams = {}
    ) =>
      this.request<File, ApiErrorResponse>({
        path: `/api/v1/organizations/${organizationSlug}/libraries/${libraryId}/videos/${videoId}/captions/${captionId}/file`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Libraries
     * @name RequestVideoTranscription
     * @summary Transcribe a processed video into a caption track with the library's provider; the worker does it in the background
     * @request POST:/api/v1/organizations/{organizationSlug}/libraries/{libraryId}/videos/{videoId}/transcriptions
     */
    requestVideoTranscription: (
      { organizationSlug, libraryId, videoId }: RequestVideoTranscriptionParams,
      data: VideoTranscriptionRequestBody,
      params: RequestParams = {}
    ) =>
      this.request<VideoTranscriptionSuccessResponse, ApiErrorResponse>({
        path: `/api/v1/organizations/${organizationSlug}/libraries/${libraryId}/videos/${videoId}/transcriptions`,
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
     * @name GetLibraryTranscriptionSettings
     * @summary Read which provider transcribes the library's videos, and whether it does so by itself
     * @request GET:/api/v1/organizations/{organizationSlug}/libraries/{libraryId}/transcription
     */
    getLibraryTranscriptionSettings: (
      { organizationSlug, libraryId }: GetLibraryTranscriptionSettingsParams,
      params: RequestParams = {}
    ) =>
      this.request<
        LibraryTranscriptionSettingsSuccessResponse,
        ApiErrorResponse
      >({
        path: `/api/v1/organizations/${organizationSlug}/libraries/${libraryId}/transcription`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Libraries
     * @name UpdateLibraryTranscriptionSettings
     * @summary Choose the organization's provider that transcribes the library's videos, and whether each is transcribed once processed
     * @request PUT:/api/v1/organizations/{organizationSlug}/libraries/{libraryId}/transcription
     */
    updateLibraryTranscriptionSettings: (
      { organizationSlug, libraryId }: UpdateLibraryTranscriptionSettingsParams,
      data: LibraryTranscriptionUpdateBody,
      params: RequestParams = {}
    ) =>
      this.request<
        LibraryTranscriptionSettingsSuccessResponse,
        ApiErrorResponse
      >({
        path: `/api/v1/organizations/${organizationSlug}/libraries/${libraryId}/transcription`,
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
     * @name SuggestVideoChapters
     * @summary Propose a processed video's chapters from one of its caption tracks with the library's provider; nothing is saved
     * @request POST:/api/v1/organizations/{organizationSlug}/libraries/{libraryId}/videos/{videoId}/chapter-suggestions
     */
    suggestVideoChapters: (
      { organizationSlug, libraryId, videoId }: SuggestVideoChaptersParams,
      data: VideoChapterSuggestionRequestBody,
      params: RequestParams = {}
    ) =>
      this.request<VideoChapterSuggestionsSuccessResponse, ApiErrorResponse>({
        path: `/api/v1/organizations/${organizationSlug}/libraries/${libraryId}/videos/${videoId}/chapter-suggestions`,
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
     * @name GetLibraryChapterGenerationSettings
     * @summary Read which provider writes chapters for the library's videos
     * @request GET:/api/v1/organizations/{organizationSlug}/libraries/{libraryId}/chapter-generation
     */
    getLibraryChapterGenerationSettings: (
      {
        organizationSlug,
        libraryId,
      }: GetLibraryChapterGenerationSettingsParams,
      params: RequestParams = {}
    ) =>
      this.request<
        LibraryChapterGenerationSettingsSuccessResponse,
        ApiErrorResponse
      >({
        path: `/api/v1/organizations/${organizationSlug}/libraries/${libraryId}/chapter-generation`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Libraries
     * @name UpdateLibraryChapterGenerationSettings
     * @summary Choose the organization's provider that writes chapters for the library's videos, or none
     * @request PUT:/api/v1/organizations/{organizationSlug}/libraries/{libraryId}/chapter-generation
     */
    updateLibraryChapterGenerationSettings: (
      {
        organizationSlug,
        libraryId,
      }: UpdateLibraryChapterGenerationSettingsParams,
      data: LibraryChapterGenerationUpdateBody,
      params: RequestParams = {}
    ) =>
      this.request<
        LibraryChapterGenerationSettingsSuccessResponse,
        ApiErrorResponse
      >({
        path: `/api/v1/organizations/${organizationSlug}/libraries/${libraryId}/chapter-generation`,
        method: "PUT",
        body: data,
        type: "application/json",
        format: "json",
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
     * No description
     *
     * @tags Library API
     * @name ReadLibraryApiVideoChapters
     * @summary Read a processed video's chapters as a WebVTT chapters track, for players of your own
     * @request GET:/api/v1/libraries/{libraryId}/videos/{videoId}/chapters.vtt
     */
    readLibraryApiVideoChapters: (
      { libraryId, videoId, ...query }: ReadLibraryApiVideoChaptersParams,
      params: RequestParams = {}
    ) =>
      this.request<File, ApiErrorResponse>({
        path: `/api/v1/libraries/${libraryId}/videos/${videoId}/chapters.vtt`,
        method: "GET",
        query: query,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Library API
     * @name GetLibraryApiPlaylistEmbed
     * @summary Read what the embeddable player needs to play a playlist; the `Referer` is the page that frames it, and signed libraries need the playlist's `key`, `expires` and `token`
     * @request GET:/api/v1/libraries/{libraryId}/playlists/{playlistId}/embed
     */
    getLibraryApiPlaylistEmbed: (
      { libraryId, playlistId, ...query }: GetLibraryApiPlaylistEmbedParams,
      params: RequestParams = {}
    ) =>
      this.request<PlaylistEmbedSuccessResponse, ApiErrorResponse>({
        path: `/api/v1/libraries/${libraryId}/playlists/${playlistId}/embed`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Library API
     * @name GetLibraryApiVideoEmbedCtas
     * @summary Read the calls to action the player shows; signed libraries need `key`, `expires` and `token`
     * @request GET:/api/v1/libraries/{libraryId}/videos/{videoId}/embed/ctas
     */
    getLibraryApiVideoEmbedCtas: (
      { libraryId, videoId, ...query }: GetLibraryApiVideoEmbedCtasParams,
      params: RequestParams = {}
    ) =>
      this.request<VideoEmbedCtaListSuccessResponse, ApiErrorResponse>({
        path: `/api/v1/libraries/${libraryId}/videos/${videoId}/embed/ctas`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Library API
     * @name ReportVideoCtaEvent
     * @summary Report that the view showed, clicked or dismissed a call to action; each counts once per view
     * @request POST:/api/v1/libraries/{libraryId}/videos/{videoId}/views/{viewId}/ctas/{ctaId}/events
     */
    reportVideoCtaEvent: (
      { libraryId, videoId, viewId, ctaId }: ReportVideoCtaEventParams,
      data: VideoCtaEventBody,
      params: RequestParams = {}
    ) =>
      this.request<LibraryEmptySuccessResponse, ApiErrorResponse>({
        path: `/api/v1/libraries/${libraryId}/videos/${videoId}/views/${viewId}/ctas/${ctaId}/events`,
        method: "POST",
        body: data,
        type: "application/json",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Library API
     * @name SubmitVideoCtaLead
     * @summary Leave an email address in an email form, with the consent checkbox ticked; once per view
     * @request POST:/api/v1/libraries/{libraryId}/videos/{videoId}/views/{viewId}/ctas/{ctaId}/leads
     */
    submitVideoCtaLead: (
      { libraryId, videoId, viewId, ctaId }: SubmitVideoCtaLeadParams,
      data: VideoCtaLeadBody,
      params: RequestParams = {}
    ) =>
      this.request<LibraryEmptySuccessResponse, ApiErrorResponse>({
        path: `/api/v1/libraries/${libraryId}/videos/${videoId}/views/${viewId}/ctas/${ctaId}/leads`,
        method: "POST",
        body: data,
        type: "application/json",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Library API
     * @name GetLibraryApiVideoEmbedCaptions
     * @summary Read a processed video's caption tracks with the URL of each WebVTT; signed libraries need `key`, `expires` and `token`
     * @request GET:/api/v1/libraries/{libraryId}/videos/{videoId}/embed/captions
     */
    getLibraryApiVideoEmbedCaptions: (
      { libraryId, videoId, ...query }: GetLibraryApiVideoEmbedCaptionsParams,
      params: RequestParams = {}
    ) =>
      this.request<VideoEmbedCaptionListSuccessResponse, ApiErrorResponse>({
        path: `/api/v1/libraries/${libraryId}/videos/${videoId}/embed/captions`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Library API
     * @name ReadLibraryApiVideoCaptionFile
     * @summary Read a caption track's WebVTT, `<captionId>.vtt`; signed libraries need `key`, `expires` and `token`
     * @request GET:/api/v1/libraries/{libraryId}/videos/{videoId}/captions/{fileName}
     */
    readLibraryApiVideoCaptionFile: (
      {
        libraryId,
        videoId,
        fileName,
        ...query
      }: ReadLibraryApiVideoCaptionFileParams,
      params: RequestParams = {}
    ) =>
      this.request<File, ApiErrorResponse>({
        path: `/api/v1/libraries/${libraryId}/videos/${videoId}/captions/${fileName}`,
        method: "GET",
        query: query,
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
     * @summary Create a draft video; upload its file to `/videos/{videoId}/uploads` with tus, or import it with `/videos/{videoId}/import`
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
     * @description Needs the `videos:upload` scope. The URL must link straight to an MP4 or MOV file on a public HTTP or HTTPS address; redirects are followed. The worker downloads it, so follow its progress with the status endpoint or the `video.uploaded` and `video.upload_failed` webhook events.
     *
     * @tags Library API
     * @name ImportLibraryApiVideo
     * @summary Import a draft video's file from a URL instead of uploading it
     * @request POST:/api/v1/libraries/{libraryId}/videos/{videoId}/import
     * @secure
     */
    importLibraryApiVideo: (
      { libraryId, videoId }: ImportLibraryApiVideoParams,
      data: VideoImportBody,
      params: RequestParams = {}
    ) =>
      this.request<VideoSuccessResponse, ApiErrorResponse>({
        path: `/api/v1/libraries/${libraryId}/videos/${videoId}/import`,
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
     * @summary Change a video's title or description
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

    /**
     * @description Needs the `videos:manage` scope.
     *
     * @tags Library API
     * @name UpdateLibraryApiVideoPoster
     * @summary Take a processed video's poster from a chosen frame, or back from the automatic one
     * @request PUT:/api/v1/libraries/{libraryId}/videos/{videoId}/poster
     * @secure
     */
    updateLibraryApiVideoPoster: (
      { libraryId, videoId }: UpdateLibraryApiVideoPosterParams,
      data: VideoPosterUpdateBody,
      params: RequestParams = {}
    ) =>
      this.request<VideoSuccessResponse, ApiErrorResponse>({
        path: `/api/v1/libraries/${libraryId}/videos/${videoId}/poster`,
        method: "PUT",
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
     * @name UploadLibraryApiVideoPosterImage
     * @summary Make an uploaded JPEG, PNG or WebP image the poster of a processed video
     * @request PUT:/api/v1/libraries/{libraryId}/videos/{videoId}/poster/image
     * @secure
     */
    uploadLibraryApiVideoPosterImage: (
      { libraryId, videoId }: UploadLibraryApiVideoPosterImageParams,
      data: VideoPosterImageBody,
      params: RequestParams = {}
    ) =>
      this.request<VideoSuccessResponse, ApiErrorResponse>({
        path: `/api/v1/libraries/${libraryId}/videos/${videoId}/poster/image`,
        method: "PUT",
        body: data,
        secure: true,
        type: "multipart/form-data",
        format: "json",
        ...params,
      }),

    /**
     * @description Needs the `videos:manage` scope.
     *
     * @tags Library API
     * @name UpdateLibraryApiVideoChapters
     * @summary Replace a processed video's chapters; the first starts at 0:00 and an empty list removes them
     * @request PUT:/api/v1/libraries/{libraryId}/videos/{videoId}/chapters
     * @secure
     */
    updateLibraryApiVideoChapters: (
      { libraryId, videoId }: UpdateLibraryApiVideoChaptersParams,
      data: VideoChaptersUpdateBody,
      params: RequestParams = {}
    ) =>
      this.request<VideoSuccessResponse, ApiErrorResponse>({
        path: `/api/v1/libraries/${libraryId}/videos/${videoId}/chapters`,
        method: "PUT",
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
     * @name ListLibraryApiPlaylists
     * @summary List the library's playlists, newest first
     * @request GET:/api/v1/libraries/{libraryId}/playlists
     * @secure
     */
    listLibraryApiPlaylists: (
      { libraryId }: ListLibraryApiPlaylistsParams,
      params: RequestParams = {}
    ) =>
      this.request<PlaylistListSuccessResponse, ApiErrorResponse>({
        path: `/api/v1/libraries/${libraryId}/playlists`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Needs the `videos:manage` scope.
     *
     * @tags Library API
     * @name CreateLibraryApiPlaylist
     * @summary Create a playlist, empty or with videos of the library
     * @request POST:/api/v1/libraries/{libraryId}/playlists
     * @secure
     */
    createLibraryApiPlaylist: (
      { libraryId }: CreateLibraryApiPlaylistParams,
      data: PlaylistCreateBody,
      params: RequestParams = {}
    ) =>
      this.request<PlaylistSuccessResponse, ApiErrorResponse>({
        path: `/api/v1/libraries/${libraryId}/playlists`,
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
     * @name GetLibraryApiPlaylist
     * @summary Read a playlist and its videos in playback order
     * @request GET:/api/v1/libraries/{libraryId}/playlists/{playlistId}
     * @secure
     */
    getLibraryApiPlaylist: (
      { libraryId, playlistId }: GetLibraryApiPlaylistParams,
      params: RequestParams = {}
    ) =>
      this.request<PlaylistSuccessResponse, ApiErrorResponse>({
        path: `/api/v1/libraries/${libraryId}/playlists/${playlistId}`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Needs the `videos:manage` scope.
     *
     * @tags Library API
     * @name UpdateLibraryApiPlaylist
     * @summary Change a playlist's title or description
     * @request PATCH:/api/v1/libraries/{libraryId}/playlists/{playlistId}
     * @secure
     */
    updateLibraryApiPlaylist: (
      { libraryId, playlistId }: UpdateLibraryApiPlaylistParams,
      data: PlaylistUpdateBody,
      params: RequestParams = {}
    ) =>
      this.request<PlaylistSuccessResponse, ApiErrorResponse>({
        path: `/api/v1/libraries/${libraryId}/playlists/${playlistId}`,
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
     * @name DeleteLibraryApiPlaylist
     * @summary Delete a playlist; its videos stay in the library
     * @request DELETE:/api/v1/libraries/{libraryId}/playlists/{playlistId}
     * @secure
     */
    deleteLibraryApiPlaylist: (
      { libraryId, playlistId }: DeleteLibraryApiPlaylistParams,
      params: RequestParams = {}
    ) =>
      this.request<LibraryEmptySuccessResponse, ApiErrorResponse>({
        path: `/api/v1/libraries/${libraryId}/playlists/${playlistId}`,
        method: "DELETE",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Needs the `videos:manage` scope.
     *
     * @tags Library API
     * @name UpdateLibraryApiPlaylistVideos
     * @summary Replace a playlist's videos, in playback order; an empty list removes them
     * @request PUT:/api/v1/libraries/{libraryId}/playlists/{playlistId}/videos
     * @secure
     */
    updateLibraryApiPlaylistVideos: (
      { libraryId, playlistId }: UpdateLibraryApiPlaylistVideosParams,
      data: PlaylistVideosUpdateBody,
      params: RequestParams = {}
    ) =>
      this.request<PlaylistSuccessResponse, ApiErrorResponse>({
        path: `/api/v1/libraries/${libraryId}/playlists/${playlistId}/videos`,
        method: "PUT",
        body: data,
        secure: true,
        type: "application/json",
        format: "json",
        ...params,
      }),

    /**
     * @description Needs the `playback:sign` scope.
     *
     * @tags Library API
     * @name CreateLibraryApiPlaylistPlaybackUrl
     * @summary Sign a playlist embed URL that expires; required when the library only allows signed playback
     * @request POST:/api/v1/libraries/{libraryId}/playlists/{playlistId}/playback-urls
     * @secure
     */
    createLibraryApiPlaylistPlaybackUrl: (
      { libraryId, playlistId }: CreateLibraryApiPlaylistPlaybackUrlParams,
      data: PlaybackUrlCreateBody,
      params: RequestParams = {}
    ) =>
      this.request<PlaylistPlaybackUrlSuccessResponse, ApiErrorResponse>({
        path: `/api/v1/libraries/${libraryId}/playlists/${playlistId}/playback-urls`,
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
     * @name ListLibraryApiVideoCtas
     * @summary List a video's calls to action: overlays by when they appear, then the end screen
     * @request GET:/api/v1/libraries/{libraryId}/videos/{videoId}/ctas
     * @secure
     */
    listLibraryApiVideoCtas: (
      { libraryId, videoId }: ListLibraryApiVideoCtasParams,
      params: RequestParams = {}
    ) =>
      this.request<VideoCtaListSuccessResponse, ApiErrorResponse>({
        path: `/api/v1/libraries/${libraryId}/videos/${videoId}/ctas`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Needs the `videos:manage` scope.
     *
     * @tags Library API
     * @name CreateLibraryApiVideoCta
     * @summary Add a call to action to a processed video: a button or an email form, as an overlay or the end screen
     * @request POST:/api/v1/libraries/{libraryId}/videos/{videoId}/ctas
     * @secure
     */
    createLibraryApiVideoCta: (
      { libraryId, videoId }: CreateLibraryApiVideoCtaParams,
      data: VideoCtaBody,
      params: RequestParams = {}
    ) =>
      this.request<VideoCtaSuccessResponse, ApiErrorResponse>({
        path: `/api/v1/libraries/${libraryId}/videos/${videoId}/ctas`,
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
     * @name UpdateLibraryApiVideoCta
     * @summary Replace a call to action's fields; its view counts and leads stay with it
     * @request PUT:/api/v1/libraries/{libraryId}/videos/{videoId}/ctas/{ctaId}
     * @secure
     */
    updateLibraryApiVideoCta: (
      { libraryId, videoId, ctaId }: UpdateLibraryApiVideoCtaParams,
      data: VideoCtaBody,
      params: RequestParams = {}
    ) =>
      this.request<VideoCtaSuccessResponse, ApiErrorResponse>({
        path: `/api/v1/libraries/${libraryId}/videos/${videoId}/ctas/${ctaId}`,
        method: "PUT",
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
     * @name DeleteLibraryApiVideoCta
     * @summary Delete a call to action and its view counts; leads left in it stay
     * @request DELETE:/api/v1/libraries/{libraryId}/videos/{videoId}/ctas/{ctaId}
     * @secure
     */
    deleteLibraryApiVideoCta: (
      { libraryId, videoId, ctaId }: DeleteLibraryApiVideoCtaParams,
      params: RequestParams = {}
    ) =>
      this.request<LibraryEmptySuccessResponse, ApiErrorResponse>({
        path: `/api/v1/libraries/${libraryId}/videos/${videoId}/ctas/${ctaId}`,
        method: "DELETE",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Needs the `leads:read` scope.
     *
     * @tags Library API
     * @name ListLibraryApiLeads
     * @summary List the email addresses viewers left in the library's calls to action, newest first
     * @request GET:/api/v1/libraries/{libraryId}/leads
     * @secure
     */
    listLibraryApiLeads: (
      { libraryId, ...query }: ListLibraryApiLeadsParams,
      params: RequestParams = {}
    ) =>
      this.request<VideoCtaLeadPageSuccessResponse, ApiErrorResponse>({
        path: `/api/v1/libraries/${libraryId}/leads`,
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
     * @name ListLibraryApiVideoCaptions
     * @summary List a video's caption tracks by language, with its latest transcriptions
     * @request GET:/api/v1/libraries/{libraryId}/videos/{videoId}/captions
     * @secure
     */
    listLibraryApiVideoCaptions: (
      { libraryId, videoId }: ListLibraryApiVideoCaptionsParams,
      params: RequestParams = {}
    ) =>
      this.request<VideoCaptionListSuccessResponse, ApiErrorResponse>({
        path: `/api/v1/libraries/${libraryId}/videos/${videoId}/captions`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Needs the `videos:manage` scope.
     *
     * @tags Library API
     * @name UploadLibraryApiVideoCaption
     * @summary Upload a WebVTT or SRT file as a caption track of a processed video; a track of the same language and kind is replaced
     * @request POST:/api/v1/libraries/{libraryId}/videos/{videoId}/captions
     * @secure
     */
    uploadLibraryApiVideoCaption: (
      { libraryId, videoId }: UploadLibraryApiVideoCaptionParams,
      data: VideoCaptionUploadBody,
      params: RequestParams = {}
    ) =>
      this.request<VideoCaptionSuccessResponse, ApiErrorResponse>({
        path: `/api/v1/libraries/${libraryId}/videos/${videoId}/captions`,
        method: "POST",
        body: data,
        secure: true,
        type: "multipart/form-data",
        format: "json",
        ...params,
      }),

    /**
     * @description Needs the `videos:manage` scope.
     *
     * @tags Library API
     * @name UpdateLibraryApiVideoCaption
     * @summary Rename a caption track, or make it the one players turn on by themselves
     * @request PUT:/api/v1/libraries/{libraryId}/videos/{videoId}/captions/{captionId}
     * @secure
     */
    updateLibraryApiVideoCaption: (
      { libraryId, videoId, captionId }: UpdateLibraryApiVideoCaptionParams,
      data: VideoCaptionUpdateBody,
      params: RequestParams = {}
    ) =>
      this.request<VideoCaptionSuccessResponse, ApiErrorResponse>({
        path: `/api/v1/libraries/${libraryId}/videos/${videoId}/captions/${captionId}`,
        method: "PUT",
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
     * @name DeleteLibraryApiVideoCaption
     * @summary Delete a caption track and its file
     * @request DELETE:/api/v1/libraries/{libraryId}/videos/{videoId}/captions/{captionId}
     * @secure
     */
    deleteLibraryApiVideoCaption: (
      { libraryId, videoId, captionId }: DeleteLibraryApiVideoCaptionParams,
      params: RequestParams = {}
    ) =>
      this.request<LibraryEmptySuccessResponse, ApiErrorResponse>({
        path: `/api/v1/libraries/${libraryId}/videos/${videoId}/captions/${captionId}`,
        method: "DELETE",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Needs the `videos:manage` scope.
     *
     * @tags Library API
     * @name RequestLibraryApiVideoTranscription
     * @summary Transcribe a processed video into a caption track with the library's provider; `video.caption.ready` or `video.transcription.failed` tells the outcome
     * @request POST:/api/v1/libraries/{libraryId}/videos/{videoId}/transcriptions
     * @secure
     */
    requestLibraryApiVideoTranscription: (
      { libraryId, videoId }: RequestLibraryApiVideoTranscriptionParams,
      data: VideoTranscriptionRequestBody,
      params: RequestParams = {}
    ) =>
      this.request<VideoTranscriptionSuccessResponse, ApiErrorResponse>({
        path: `/api/v1/libraries/${libraryId}/videos/${videoId}/transcriptions`,
        method: "POST",
        body: data,
        secure: true,
        type: "application/json",
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
