import { resolver, type GenerateSpecOptions } from "hono-openapi"
import type { ZodType } from "zod"
import { apiErrorResponseSchema } from "../response/response.schemas"
import { OPENAPI_DOCUMENTATION } from "./openapi.constants"
import type {
  ApiErrorResponseDescriptions,
  OpenApiResponses,
} from "./openapi.types"

export const describeJsonResponse = (description: string, schema: ZodType) => ({
  description,
  content: { "application/json": { schema: resolver(schema) } },
})

/** Documents error statuses; every one of them replies with `ApiErrorResponse`. */
export const describeApiErrorResponses = (
  descriptions: ApiErrorResponseDescriptions
): OpenApiResponses =>
  Object.fromEntries(
    Object.entries(descriptions).map(([status, description]) => [
      status,
      describeJsonResponse(description, apiErrorResponseSchema),
    ])
  )

export const OPENAPI_SPEC_OPTIONS: Partial<GenerateSpecOptions> = {
  documentation: OPENAPI_DOCUMENTATION,
  defaultValidationErrorResponse: false,
}
