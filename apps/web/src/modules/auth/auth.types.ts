import type { QueryClient } from "@tanstack/react-query"
import type { z } from "zod"

import type {
  forgotPasswordSchema,
  resetPasswordFormSchema,
  signInSchema,
  signUpFormSchema,
} from "./auth.schemas"

export type SignInValues = z.infer<ReturnType<typeof signInSchema>>
export type SignUpFormValues = z.infer<ReturnType<typeof signUpFormSchema>>
export type ForgotPasswordValues = z.infer<
  ReturnType<typeof forgotPasswordSchema>
>
export type ResetPasswordFormValues = z.infer<
  ReturnType<typeof resetPasswordFormSchema>
>

export type AuthGuardParams = {
  queryClient: QueryClient
  location: { href: string; search: Record<string, unknown> }
}
