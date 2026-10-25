import {
  ORGANIZATION_FIELD_LIMITS,
  ORGANIZATION_SLUG_PATTERN,
  RESERVED_ORGANIZATION_SLUGS,
} from "../constants/organizations.constants"

/** Turns free text such as an organization name into slug form: `Café Ünd Co` → `cafe-und-co`. */
export const normalizeOrganizationSlug = (value: string): string =>
  value
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")

export const isValidOrganizationSlug = (value: string): boolean =>
  value.length >= ORGANIZATION_FIELD_LIMITS.SLUG_MIN_LENGTH &&
  value.length <= ORGANIZATION_FIELD_LIMITS.SLUG_MAX_LENGTH &&
  ORGANIZATION_SLUG_PATTERN.test(value) &&
  !RESERVED_ORGANIZATION_SLUGS.has(value)
