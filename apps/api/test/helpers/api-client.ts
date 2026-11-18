import { API_BASE_PATH } from "../../src/common/http/http.constants"
import { TEST_WEB_ORIGIN } from "./test-app"

import type { TestApp } from "./test-app"

export type ApiRequestOptions = {
  method?: string
  body?: unknown
  /** Sent as is instead of JSON, e.g. the bytes of a tus upload chunk. */
  rawBody?: Uint8Array<ArrayBuffer>
  /** Sent as `multipart/form-data`, e.g. an image upload. */
  formData?: FormData
  headers?: Record<string, string>
}

export type ApiClient = ReturnType<typeof createApiClient>

/** Sends API requests the way the web app does: same origin, JSON, session cookie. */
export function createApiClient(testApp: TestApp, cookie?: string) {
  const request = (path: string, options: ApiRequestOptions = {}) =>
    testApp.app.request(`${TEST_WEB_ORIGIN}${API_BASE_PATH}${path}`, {
      method: options.method ?? "GET",
      headers: {
        origin: TEST_WEB_ORIGIN,
        ...(options.formData ? {} : { "content-type": "application/json" }),
        ...(cookie ? { cookie } : {}),
        ...options.headers,
      },
      body:
        options.formData ??
        options.rawBody ??
        (options.body === undefined ? undefined : JSON.stringify(options.body)),
    })

  return {
    request,
    get: (path: string) => request(path),
    post: (path: string, body?: unknown) =>
      request(path, { method: "POST", body }),
    patch: (path: string, body?: unknown) =>
      request(path, { method: "PATCH", body }),
    put: (path: string, body?: unknown) =>
      request(path, { method: "PUT", body }),
    delete: (path: string) => request(path, { method: "DELETE" }),
  }
}

export const sessionCookieFrom = (response: Response) =>
  response.headers.get("set-cookie")?.split(";")[0]

/** Signs in through the API and returns a client carrying the session cookie. */
export async function signInAsUser(
  testApp: TestApp,
  credentials: { email: string; password: string }
) {
  const response = await createApiClient(testApp).post(
    "/auth/sign-in/email",
    credentials
  )
  const cookie = sessionCookieFrom(response)

  if (!cookie) throw new Error(`Sign-in failed with ${response.status}`)

  return createApiClient(testApp, cookie)
}
