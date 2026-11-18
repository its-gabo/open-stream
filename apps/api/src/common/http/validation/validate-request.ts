import type { ValidationTargets } from "hono"
import { validator } from "hono-openapi"
import type { ZodType } from "zod"
import { HTTP_ERROR_RESPONSES } from "../errors/http-error.constants"
import { ApiException } from "../response/response.exception"

/**
 * Validates and documents a request part in OpenAPI, reporting failures in
 * the unified API error format. `media` names the one body type a form
 * accepts, e.g. `multipart/form-data` for files.
 */
export const validateRequest = <
  TTarget extends keyof ValidationTargets,
  TSchema extends ZodType,
>(
  target: TTarget,
  schema: TSchema,
  options?: { media: string }
) =>
  validator(
    target,
    schema,
    (result) => {
      if (!result.success) {
        throw new ApiException(422, HTTP_ERROR_RESPONSES.VALIDATION_FAILED)
      }
    },
    options
  )
