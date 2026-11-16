import { API_BASE_PATH } from "../../src/common/http/http.constants"
import { TEST_WEB_ORIGIN } from "./test-app"

import type { ApiClient, ApiRequestOptions } from "./api-client"
import type { TestApp } from "./test-app"

/**
 * Sends library API requests the way a customer's server does: the API key
 * as a bearer token, and no browser `Origin` or cookies.
 */
export function createLibraryApiClient(
  testApp: TestApp,
  apiKey?: string
): ApiClient {
  const request = (path: string, options: ApiRequestOptions = {}) =>
    testApp.app.request(`${TEST_WEB_ORIGIN}${API_BASE_PATH}${path}`, {
      method: options.method ?? "GET",
      headers: {
        "content-type": "application/json",
        ...(apiKey ? { authorization: `Bearer ${apiKey}` } : {}),
        ...options.headers,
      },
      body:
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
