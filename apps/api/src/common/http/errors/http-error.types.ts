import type { ContentfulStatusCode } from "hono/utils/http-status"
import type { ApiErrorResponse } from "../response/response.types"

export type HttpErrorReply = {
  status: ContentfulStatusCode
  body: ApiErrorResponse
}
