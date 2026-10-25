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

export interface DeclineOrganizationInvitationParams {
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  invitationId: string
}

export interface GetOrganizationParams {
  organizationSlug: string
}

export interface GetOrganizationTeamParams {
  organizationSlug: string
}

export interface InviteOrganizationMemberParams {
  organizationSlug: string
}

export interface LeaveOrganizationParams {
  organizationSlug: string
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

export interface RemoveOrganizationMemberParams {
  /**
   * @format uuid
   * @pattern ^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$
   */
  membershipId: string
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

export interface ScheduleOrganizationDeletionParams {
  organizationSlug: string
}

export interface SelectOrganizationParams {
  organizationSlug: string
}

export interface SuggestOrganizationSlugParams {
  /**
   * @minLength 1
   * @maxLength 120
   */
  name: string
}

export interface TransferOrganizationOwnershipParams {
  organizationSlug: string
}

export interface UpdateOrganizationParams {
  organizationSlug: string
}

export interface VerifyEmailParams {
  /** @pattern ^[a-f0-9]{64}$ */
  token: string
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
}
