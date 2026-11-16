import { buildOrganizationPath } from "@/modules/organizations/organizations.utils"

/** A navigation item is active on its own page and, unless it is the organization root, on pages below it. */
export function isNavigationItemActive(
  pathname: string,
  organizationSlug: string,
  itemPath: string
) {
  const fullPath = buildOrganizationPath(organizationSlug, itemPath)

  return (
    pathname === fullPath ||
    (itemPath !== "" && pathname.startsWith(`${fullPath}/`))
  )
}
