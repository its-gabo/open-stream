import type { ValidationTargets } from "hono"
import { validator } from "hono-openapi"
import type { ZodType } from "zod"
import { HTTP_ERROR_RESPONSES } from "../errors/http-error.constants"
import { ApiException } from "../response/response.exception"

/**
 * Validates and documents a request part in OpenAPI, reporting failures in
 * the unified API error format.
 */
export const validateRequest = <
  TTarget extends keyof ValidationTargets,
  TSchema extends ZodType,
>(
  target: TTarget,
  schema: TSchema
) =>
  validator(target, schema, (result) => {
    if (!result.success) {
      throw new ApiException(422, HTTP_ERROR_RESPONSES.VALIDATION_FAILED)
    }
  })
