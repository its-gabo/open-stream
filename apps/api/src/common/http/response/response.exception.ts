import type { ContentfulStatusCode } from "hono/utils/http-status"
import type { ApiErrorResponse } from "./response.types"

/** HTTP-level failure that already knows its status and public error body. */
export class ApiException extends Error {
  constructor(
    readonly status: ContentfulStatusCode,
    readonly body: ApiErrorResponse
  ) {
    super(body.message)
    this.name = ApiException.name
  }
}
