import type { ResponsesWithResolver } from "hono-openapi"
import type { ContentfulStatusCode } from "hono/utils/http-status"

export type ApiErrorResponseDescriptions = Partial<
  Record<ContentfulStatusCode, string>
>

export type OpenApiResponses = ResponsesWithResolver
