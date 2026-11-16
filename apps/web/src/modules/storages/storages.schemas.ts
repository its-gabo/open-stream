import {
  STORAGE_BUCKET_PATTERN,
  STORAGE_FIELD_LIMITS,
  isValidStoragePathTemplate,
} from "@workspace/shared"
import { z } from "zod"

import { STORAGE_ADDRESSING_STYLES } from "./storages.constants"

import type { TranslationFunction } from "@/i18n/i18n.types"

const credentialSchema = (t: TranslationFunction, isRequired: boolean) =>
  z
    .string()
    .trim()
    .min(isRequired ? 1 : 0, t("validation.storage.credentials"))
    .max(STORAGE_FIELD_LIMITS.CREDENTIAL_MAX_LENGTH)

/**
 * New storages need credentials; when editing, leaving both credential fields
 * empty keeps the saved ones.
 */
export const storageFormSchema = (
  t: TranslationFunction,
  { requireCredentials }: { requireCredentials: boolean }
) =>
  z
    .object({
      name: z
        .string()
        .trim()
        .min(1, t("validation.storage.name"))
        .max(
          STORAGE_FIELD_LIMITS.NAME_MAX_LENGTH,
          t("validation.storage.name_max_length", {
            max: STORAGE_FIELD_LIMITS.NAME_MAX_LENGTH,
          })
        )
        .meta({
          label: t("storages.fields.name"),
          placeholder: t("storages.fields.name_placeholder"),
          type: "text",
          autoComplete: "off",
        }),
      endpoint: z
        .url({
          protocol: /^https?$/,
          error: t("validation.storage.endpoint"),
        })
        .max(STORAGE_FIELD_LIMITS.ENDPOINT_MAX_LENGTH)
        .meta({
          label: t("storages.fields.endpoint"),
          placeholder: "https://s3.eu-central-1.amazonaws.com",
          type: "text",
          autoComplete: "off",
        }),
      region: z
        .string()
        .trim()
        .min(1, t("validation.storage.region"))
        .max(STORAGE_FIELD_LIMITS.REGION_MAX_LENGTH)
        .meta({
          label: t("storages.fields.region"),
          placeholder: "eu-central-1",
          type: "text",
          autoComplete: "off",
        }),
      bucket: z
        .string()
        .trim()
        .regex(STORAGE_BUCKET_PATTERN, t("validation.storage.bucket"))
        .meta({
          label: t("storages.fields.bucket"),
          placeholder: "acme-videos",
          type: "text",
          autoComplete: "off",
        }),
      addressingStyle: z.enum(STORAGE_ADDRESSING_STYLES).meta({
        label: t("storages.fields.addressing_style"),
        type: "select",
        options: [
          {
            value: STORAGE_ADDRESSING_STYLES.PATH,
            label: t("storages.addressing_styles.path"),
          },
          {
            value: STORAGE_ADDRESSING_STYLES.VIRTUAL_HOSTED,
            label: t("storages.addressing_styles.virtual_hosted"),
          },
        ],
      }),
      pathTemplate: z
        .string()
        .trim()
        .refine(
          isValidStoragePathTemplate,
          t("validation.storage.path_template")
        )
        .meta({
          label: t("storages.fields.path_template"),
          placeholder: "{organizationId}/{libraryId}/{videoId}",
          type: "text",
          autoComplete: "off",
        }),
      accessKeyId: credentialSchema(t, requireCredentials).meta({
        label: t("storages.fields.access_key_id"),
        placeholder: requireCredentials
          ? undefined
          : t("storages.fields.keep_saved_placeholder"),
        type: "text",
        autoComplete: "off",
      }),
      secretAccessKey: credentialSchema(t, requireCredentials).meta({
        label: t("storages.fields.secret_access_key"),
        placeholder: requireCredentials
          ? undefined
          : t("storages.fields.keep_saved_placeholder"),
        type: "password",
        autoComplete: "new-password",
      }),
    })
    .refine(
      ({ accessKeyId, secretAccessKey }) =>
        (accessKeyId === "") === (secretAccessKey === ""),
      {
        error: t("validation.storage.credentials_pair"),
        path: ["secretAccessKey"],
      }
    )
