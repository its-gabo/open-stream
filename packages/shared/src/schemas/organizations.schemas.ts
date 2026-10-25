import { z } from "zod"
import { ORGANIZATION_FIELD_LIMITS } from "../constants/organizations.constants"
import { isValidOrganizationSlug } from "../utils/organizations.utils"

export const organizationNameSchema = z
  .string()
  .trim()
  .min(1)
  .max(ORGANIZATION_FIELD_LIMITS.NAME_MAX_LENGTH)

/** A slug as stored: already normalized, not reserved. */
export const organizationSlugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .refine(isValidOrganizationSlug)
