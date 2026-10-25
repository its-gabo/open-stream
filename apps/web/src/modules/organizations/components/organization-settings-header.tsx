import { useLocation, useNavigate } from "@tanstack/react-router"
import { Tabs, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"
import { useTranslation } from "react-i18next"

import { buildOrganizationPath } from "../organizations.utils"

type OrganizationSettingsHeaderProps = {
  organizationSlug: string
}

export function OrganizationSettingsHeader({
  organizationSlug,
}: OrganizationSettingsHeaderProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const organizationPath = buildOrganizationPath(
    organizationSlug,
    "settings/organization"
  )
  const teamPath = buildOrganizationPath(organizationSlug, "settings/team")
  const activePath = pathname === teamPath ? teamPath : organizationPath

  const handleTabChange = (value: unknown) => {
    if (value !== organizationPath && value !== teamPath) return

    void navigate({ href: value })
  }

  return (
    <Tabs value={activePath} onValueChange={handleTabChange} className="gap-0">
      <TabsList
        variant="line"
        aria-label={t("organizations.settings.eyebrow")}
        className="h-12 w-full justify-start gap-5 border-b px-4 sm:px-5"
      >
        <TabsTrigger value={organizationPath} className="h-full flex-none px-0">
          {t("organizations.settings.organization_tab")}
        </TabsTrigger>
        <TabsTrigger value={teamPath} className="h-full flex-none px-0">
          {t("organizations.settings.team_tab")}
        </TabsTrigger>
      </TabsList>
    </Tabs>
  )
}
