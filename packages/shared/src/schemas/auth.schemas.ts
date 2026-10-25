import { z } from "zod"
import {
  AUTH_FIELD_LIMITS,
  AUTH_TOKEN_PATTERN,
} from "../constants/auth.constants"
import { isSafeRedirectPath } from "../utils/url.utils"

export const authTokenSchema = z.string().regex(AUTH_TOKEN_PATTERN)

export const safeRedirectPathSchema = z
  .string()
  .max(AUTH_FIELD_LIMITS.REDIRECT_PATH_MAX_LENGTH)
  .refine(isSafeRedirectPath)
