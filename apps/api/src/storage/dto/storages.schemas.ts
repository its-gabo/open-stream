import {
  STORAGE_FIELD_LIMITS,
  storageBucketSchema,
  storageCredentialSchema,
  storageNameSchema,
  storagePathTemplateSchema,
} from "@workspace/shared"
import { z } from "zod"
import { paginationDtoSchema } from "../../common/http/pagination/pagination.schemas"
import {
  apiEmptyDataSchema,
  createApiSuccessResponseSchema,
} from "../../common/http/response/response.schemas"

export const storageParamSchema = z.object({
  organizationSlug: z.string(),
  storageId: z.uuid(),
})

const storageConnectionFields = {
  endpoint: z
    .string()
    .trim()
    .max(STORAGE_FIELD_LIMITS.ENDPOINT_MAX_LENGTH)
    .pipe(z.url({ protocol: /^https?$/ })),
  region: z.string().trim().min(1).max(STORAGE_FIELD_LIMITS.REGION_MAX_LENGTH),
  bucket: storageBucketSchema,
  forcePathStyle: z.boolean(),
}

export const storageConnectionTestBodySchema = z
  .object({
    ...storageConnectionFields,
    accessKeyId: storageCredentialSchema,
    secretAccessKey: storageCredentialSchema,
  })
  .meta({ id: "StorageConnectionTestBody" })

export const storageCreateBodySchema = z
  .object({
    name: storageNameSchema,
    ...storageConnectionFields,
    pathTemplate: storagePathTemplateSchema,
    accessKeyId: storageCredentialSchema,
    secretAccessKey: storageCredentialSchema,
  })
  .meta({ id: "StorageCreateBody" })

/** Credentials are write-only: send both to replace them, or neither to keep the saved ones. */
export const storageUpdateBodySchema = z
  .object({
    name: storageNameSchema,
    ...storageConnectionFields,
    pathTemplate: storagePathTemplateSchema,
    accessKeyId: storageCredentialSchema.optional(),
    secretAccessKey: storageCredentialSchema.optional(),
  })
  .refine(
    (body) =>
      (body.accessKeyId === undefined) === (body.secretAccessKey === undefined)
  )
  .meta({ id: "StorageUpdateBody" })

/** Credentials are never returned; `accessKeyIdHint` holds the last characters of the key id. */
export const storageDtoSchema = z
  .object({
    id: z.uuid(),
    name: z.string(),
    endpoint: z.string(),
    region: z.string(),
    bucket: z.string(),
    forcePathStyle: z.boolean(),
    pathTemplate: z.string(),
    accessKeyIdHint: z.string(),
    libraryCount: z.int().nonnegative(),
    /** True once a video file was written to it; its bucket and path template can no longer change. */
    isLocked: z.boolean(),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
  })
  .meta({ id: "Storage" })

export const storageConnectionTestDtoSchema = z
  .object({ isReachable: z.boolean() })
  .meta({ id: "StorageConnectionTest" })

export const storageListSuccessResponseSchema = createApiSuccessResponseSchema(
  z.object({
    storages: z.array(storageDtoSchema),
    pagination: paginationDtoSchema,
  })
).meta({ id: "StorageListSuccessResponse" })

export const storageSuccessResponseSchema = createApiSuccessResponseSchema(
  z.object({ storage: storageDtoSchema })
).meta({ id: "StorageSuccessResponse" })

export const storageEmptySuccessResponseSchema = createApiSuccessResponseSchema(
  apiEmptyDataSchema
).meta({ id: "StorageEmptySuccessResponse" })

export const storageConnectionTestSuccessResponseSchema =
  createApiSuccessResponseSchema(
    z.object({ connection: storageConnectionTestDtoSchema })
  ).meta({ id: "StorageConnectionTestSuccessResponse" })

export type StorageConnectionTestBody = z.infer<
  typeof storageConnectionTestBodySchema
>
export type StorageCreateBody = z.infer<typeof storageCreateBodySchema>
export type StorageUpdateBody = z.infer<typeof storageUpdateBodySchema>
export type StorageDto = z.infer<typeof storageDtoSchema>
