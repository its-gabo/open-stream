import {
  AUTH_FIELD_LIMITS,
  authTokenSchema,
  safeRedirectPathSchema,
} from "@workspace/shared"
import { z } from "zod"
import {
  apiEmptyDataSchema,
  createApiSuccessResponseSchema,
} from "../../common/http/response/response.schemas"

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email().max(AUTH_FIELD_LIMITS.EMAIL_MAX_LENGTH))

const passwordSchema = z
  .string()
  .min(AUTH_FIELD_LIMITS.PASSWORD_MIN_LENGTH)
  .max(AUTH_FIELD_LIMITS.PASSWORD_MAX_LENGTH)

export const authSignUpBodySchema = z
  .object({
    name: z.string().trim().min(1).max(AUTH_FIELD_LIMITS.NAME_MAX_LENGTH),
    email: emailSchema,
    password: passwordSchema,
    redirectTo: safeRedirectPathSchema.optional(),
  })
  .meta({ id: "AuthSignUpBody" })

export const authSignInBodySchema = z
  .object({
    email: emailSchema,
    password: z.string().min(1).max(AUTH_FIELD_LIMITS.PASSWORD_MAX_LENGTH),
  })
  .meta({ id: "AuthSignInBody" })

export const authForgotPasswordBodySchema = z
  .object({ email: emailSchema })
  .meta({ id: "AuthForgotPasswordBody" })

export const authResetPasswordBodySchema = z
  .object({
    token: authTokenSchema,
    password: passwordSchema,
  })
  .meta({ id: "AuthResetPasswordBody" })

export const authVerifyEmailQuerySchema = z.object({ token: authTokenSchema })

export const authUserDtoSchema = z
  .object({
    id: z.uuid(),
    email: z.email(),
    name: z.string(),
    emailVerified: z.boolean(),
  })
  .meta({ id: "AuthUser" })

export const authSessionDtoSchema = z
  .discriminatedUnion("authenticated", [
    z.object({ authenticated: z.literal(false) }),
    z.object({ authenticated: z.literal(true), user: authUserDtoSchema }),
  ])
  .meta({ id: "AuthSession" })

export const authEmptySuccessResponseSchema = createApiSuccessResponseSchema(
  apiEmptyDataSchema
).meta({ id: "AuthEmptySuccessResponse" })

export const authSignInSuccessResponseSchema = createApiSuccessResponseSchema(
  z.object({ user: authUserDtoSchema })
).meta({ id: "AuthSignInSuccessResponse" })

export const authSessionSuccessResponseSchema = createApiSuccessResponseSchema(
  authSessionDtoSchema
).meta({ id: "AuthSessionSuccessResponse" })

export type AuthUserDto = z.infer<typeof authUserDtoSchema>
export type AuthSessionDto = z.infer<typeof authSessionDtoSchema>
export type AuthSignUpBody = z.infer<typeof authSignUpBodySchema>
export type AuthSignInBody = z.infer<typeof authSignInBodySchema>
export type AuthForgotPasswordBody = z.infer<
  typeof authForgotPasswordBodySchema
>
export type AuthResetPasswordBody = z.infer<typeof authResetPasswordBodySchema>
