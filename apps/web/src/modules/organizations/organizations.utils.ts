export function buildOrganizationPath(organizationSlug: string, suffix = "") {
  const normalizedSuffix = suffix.replace(/^\/+/, "")

  return normalizedSuffix
    ? `/${organizationSlug}/${normalizedSuffix}`
    : `/${organizationSlug}`
}

export function formatOrganizationDeletionDate(
  value: string | null,
  locale: string
) {
  if (!value) return ""

  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

export function formatOrganizationInvitationExpiry(
  value: string,
  locale: string
) {
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
    new Date(value)
  )
}
