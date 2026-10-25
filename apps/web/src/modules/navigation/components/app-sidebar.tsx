import { Link, useLocation } from "@tanstack/react-router"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@workspace/ui/components/sidebar"
import { useTranslation } from "react-i18next"

import { APP_NAVIGATION } from "../navigation.constants"
import { AppBrand } from "./app-brand"

import { OrganizationSwitcher } from "@/modules/organizations/components/organization-switcher"
import { buildOrganizationPath } from "@/modules/organizations/organizations.utils"

type AppSidebarProps = {
  organizationSlug: string
}

export function AppSidebar({ organizationSlug }: AppSidebarProps) {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const { isMobile, setOpenMobile } = useSidebar()

  const closeMobileSidebar = () => {
    if (isMobile) setOpenMobile(false)
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="gap-1">
        <AppBrand />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t("navigation.workspace")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {APP_NAVIGATION.map((item) => {
                const itemPath = buildOrganizationPath(
                  organizationSlug,
                  item.path
                )

                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      render={
                        <Link to={item.to} params={{ organizationSlug }} />
                      }
                      isActive={pathname === itemPath}
                      tooltip={t(item.labelKey)}
                      onClick={closeMobileSidebar}
                    >
                      <item.icon />
                      <span>{t(item.labelKey)}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <OrganizationSwitcher organizationSlug={organizationSlug} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
