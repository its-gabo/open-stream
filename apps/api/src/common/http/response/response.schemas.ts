import { z } from "zod"

export const apiErrorResponseSchema = z
  .object({
    code: z.string(),
    message: z.string(),
    reason: z.string(),
  })
  .meta({ id: "ApiErrorResponse" })

export const apiEmptyDataSchema = z.object({}).meta({ id: "ApiEmptyData" })

export const createApiSuccessResponseSchema = <TData extends z.ZodType>(
  dataSchema: TData
) =>
  z.object({
    code: z.string(),
    message: z.string(),
    data: dataSchema,
  })
