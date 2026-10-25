import { AUTH_FIELD_LIMITS, safeRedirectPathSchema } from "@workspace/shared"
import { z } from "zod"

import type { TranslationFunction } from "@/i18n/i18n.types"

const optionalSearchTokenSchema = z.string().min(1).optional().catch(undefined)
const optionalRedirectPathSchema = safeRedirectPathSchema
  .optional()
  .catch(undefined)

export const redirectSearchSchema = z.object({
  redirectTo: optionalRedirectPathSchema,
})

export const resetPasswordSearchSchema = z.object({
  token: optionalSearchTokenSchema,
})

export const verifyEmailSearchSchema = z.object({
  token: optionalSearchTokenSchema,
  redirectTo: optionalRedirectPathSchema,
})

function createEmailSchema(t: TranslationFunction) {
  return z
    .email(t("validation.email.invalid"))
    .max(AUTH_FIELD_LIMITS.EMAIL_MAX_LENGTH, t("validation.email.invalid"))
    .trim()
}

function createPasswordSchema(t: TranslationFunction) {
  return z
    .string()
    .min(
      AUTH_FIELD_LIMITS.PASSWORD_MIN_LENGTH,
      t("validation.password.min_length", {
        min: AUTH_FIELD_LIMITS.PASSWORD_MIN_LENGTH,
      })
    )
    .max(
      AUTH_FIELD_LIMITS.PASSWORD_MAX_LENGTH,
      t("validation.password.max_length", {
        max: AUTH_FIELD_LIMITS.PASSWORD_MAX_LENGTH,
      })
    )
}

function createNameSchema(t: TranslationFunction) {
  return z
    .string()
    .trim()
    .min(1, t("validation.name.required"))
    .max(
      AUTH_FIELD_LIMITS.NAME_MAX_LENGTH,
      t("validation.name.max_length", {
        max: AUTH_FIELD_LIMITS.NAME_MAX_LENGTH,
      })
    )
}

export const signInSchema = (t: TranslationFunction) =>
  z.object({
    email: createEmailSchema(t).meta({
      label: t("pages.sign_in.email_label"),
      placeholder: t("pages.sign_in.email_placeholder"),
      type: "email",
      autoComplete: "email",
    }),
    password: z
      .string()
      .min(1, t("validation.password.required"))
      .max(
        AUTH_FIELD_LIMITS.PASSWORD_MAX_LENGTH,
        t("validation.password.max_length", {
          max: AUTH_FIELD_LIMITS.PASSWORD_MAX_LENGTH,
        })
      )
      .meta({
        label: t("pages.sign_in.password_label"),
        placeholder: t("pages.sign_in.password_placeholder"),
        type: "password",
        autoComplete: "current-password",
      }),
  })

export const signUpFormSchema = (t: TranslationFunction) =>
  z
    .object({
      name: createNameSchema(t).meta({
        label: t("pages.sign_up.name_label"),
        placeholder: t("pages.sign_up.name_placeholder"),
        type: "text",
        autoComplete: "name",
      }),
      email: createEmailSchema(t).meta({
        label: t("pages.sign_up.email_label"),
        placeholder: t("pages.sign_up.email_placeholder"),
        type: "email",
        autoComplete: "email",
      }),
      password: createPasswordSchema(t).meta({
        label: t("pages.sign_up.password_label"),
        placeholder: t("pages.sign_up.password_placeholder"),
        type: "password",
        autoComplete: "new-password",
      }),
      confirmPassword: createPasswordSchema(t).meta({
        label: t("pages.sign_up.confirm_password_label"),
        placeholder: t("pages.sign_up.confirm_password_placeholder"),
        type: "password",
        autoComplete: "new-password",
      }),
    })
    .refine(({ password, confirmPassword }) => password === confirmPassword, {
      message: t("validation.password.confirm_mismatch"),
      path: ["confirmPassword"],
    })

export const forgotPasswordSchema = (t: TranslationFunction) =>
  z.object({
    email: createEmailSchema(t).meta({
      label: t("pages.forgot_password.email_label"),
      placeholder: t("pages.forgot_password.email_placeholder"),
      type: "email",
      autoComplete: "email",
    }),
  })

export const resetPasswordFormSchema = (t: TranslationFunction) =>
  z
    .object({
      password: createPasswordSchema(t).meta({
        label: t("pages.reset_password.new_password_label"),
        placeholder: t("pages.reset_password.new_password_placeholder"),
        type: "password",
        autoComplete: "new-password",
      }),
      confirmPassword: createPasswordSchema(t).meta({
        label: t("pages.reset_password.confirm_password_label"),
        placeholder: t("pages.reset_password.confirm_password_placeholder"),
        type: "password",
        autoComplete: "new-password",
      }),
    })
    .refine(({ password, confirmPassword }) => password === confirmPassword, {
      message: t("validation.password.confirm_mismatch"),
      path: ["confirmPassword"],
    })
