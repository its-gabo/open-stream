import {
  AUTH_FIELD_LIMITS,
  ORGANIZATION_DELETE_CONFIRMATION_PHRASE,
  ORGANIZATION_FIELD_LIMITS,
  isValidOrganizationSlug,
} from "@workspace/shared"
import { z } from "zod"

import {
  ORGANIZATION_DELETION_ACTIONS,
  ORGANIZATION_INBOX_TABS,
} from "./organizations.constants"

import type { FormFieldSelectOption } from "@workspace/ui/lib/form-field.types"

import type { TranslationFunction } from "@/i18n/i18n.types"

export const inboxSearchSchema = z.object({
  tab: z.enum(ORGANIZATION_INBOX_TABS).optional().catch(undefined),
  invitationId: z.uuid().optional().catch(undefined),
})

export const organizationDeletionSearchSchema = z.object({
  action: z.enum(ORGANIZATION_DELETION_ACTIONS).optional().catch(undefined),
  token: z.string().min(1).optional().catch(undefined),
})

function createNameSchema(t: TranslationFunction) {
  return z
    .string()
    .trim()
    .min(1, t("validation.organization_name.required"))
    .max(
      ORGANIZATION_FIELD_LIMITS.NAME_MAX_LENGTH,
      t("validation.organization_name.max_length", {
        max: ORGANIZATION_FIELD_LIMITS.NAME_MAX_LENGTH,
      })
    )
    .meta({
      label: t("organizations.fields.name"),
      placeholder: t("organizations.fields.name_placeholder"),
      type: "text",
      autoComplete: "organization",
    })
}

function createSlugSchema(t: TranslationFunction) {
  return z
    .string()
    .trim()
    .toLowerCase()
    .refine(isValidOrganizationSlug, t("validation.organization_slug.invalid"))
    .meta({
      label: t("organizations.fields.slug"),
      placeholder: t("organizations.fields.slug_placeholder"),
      type: "text",
      autoComplete: "off",
    })
}

function createNameConfirmationSchema(
  t: TranslationFunction,
  organizationName: string
) {
  return z
    .string()
    .refine(
      (value) => value.trim() === organizationName,
      t("validation.organization_confirmation.name_mismatch")
    )
    .meta({
      label: t("organizations.danger.confirm_name"),
      placeholder: organizationName,
      type: "text",
      autoComplete: "off",
    })
}

export const organizationCreateFormSchema = (t: TranslationFunction) =>
  z.object({ name: createNameSchema(t), slug: createSlugSchema(t) })

export const organizationProfileFormSchema = organizationCreateFormSchema

export const organizationInviteFormSchema = (t: TranslationFunction) =>
  z.object({
    email: z
      .email(t("validation.email.invalid"))
      .max(AUTH_FIELD_LIMITS.EMAIL_MAX_LENGTH, t("validation.email.invalid"))
      .trim()
      .meta({
        label: t("organizations.team.invite_email"),
        placeholder: t("organizations.team.invite_email_placeholder"),
        type: "email",
        autoComplete: "off",
      }),
  })

export const organizationTransferFormSchema = (
  t: TranslationFunction,
  organizationName: string,
  memberOptions: FormFieldSelectOption[]
) =>
  z.object({
    membershipId: z.uuid(t("validation.organization_transfer.recipient")).meta({
      label: t("organizations.danger.transfer_recipient"),
      placeholder: t("organizations.danger.transfer_recipient_placeholder"),
      searchPlaceholder: t(
        "organizations.danger.transfer_recipient_search_placeholder"
      ),
      emptyMessage: t("organizations.danger.transfer_recipient_empty"),
      type: "select",
      options: memberOptions,
    }),
    organizationName: createNameConfirmationSchema(t, organizationName),
  })

export const organizationDeletionFormSchema = (
  t: TranslationFunction,
  organizationName: string
) =>
  z.object({
    organizationName: createNameConfirmationSchema(t, organizationName),
    confirmationPhrase: z
      .string()
      .refine(
        (value) => value.trim() === ORGANIZATION_DELETE_CONFIRMATION_PHRASE,
        t("validation.organization_confirmation.phrase_mismatch")
      )
      .meta({
        label: t("organizations.danger.confirm_phrase", {
          phrase: ORGANIZATION_DELETE_CONFIRMATION_PHRASE,
        }),
        placeholder: ORGANIZATION_DELETE_CONFIRMATION_PHRASE,
        type: "text",
        autoComplete: "off",
      }),
  })
