import { z } from "zod"
import { STORAGE_ENCRYPTION_KEY_BYTES } from "../constants/app-config.constants"
import { booleanEnvSchema } from "./env.schemas"

export const storageConfigSchema = z.object({
  OBJECT_STORAGE_ENDPOINT: z.url().default("http://localhost:9000"),
  OBJECT_STORAGE_REGION: z.string().min(1).default("us-east-1"),
  OBJECT_STORAGE_BUCKET: z.string().min(3).default("open-stream"),
  OBJECT_STORAGE_ACCESS_KEY_ID: z.string().min(1),
  OBJECT_STORAGE_SECRET_ACCESS_KEY: z.string().min(1),
  /** Path-style URLs (`endpoint/bucket/key`), required by most self-hosted S3 servers. */
  OBJECT_STORAGE_FORCE_PATH_STYLE: booleanEnvSchema.default(true),
  /** Lets custom library storages use plain HTTP and private hosts; defaults to off in production. */
  STORAGE_ALLOW_PRIVATE_ENDPOINTS: booleanEnvSchema.optional(),
  /** Base64 key that encrypts the credentials of custom library storages. */
  STORAGE_ENCRYPTION_KEY: z
    .base64()
    .refine(
      (value) =>
        Buffer.from(value, "base64").length === STORAGE_ENCRYPTION_KEY_BYTES,
      { message: `Must be ${STORAGE_ENCRYPTION_KEY_BYTES} bytes of base64` }
    ),
})
