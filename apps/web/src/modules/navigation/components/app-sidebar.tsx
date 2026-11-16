import { Link, useLocation } from "@tanstack/react-router"
import { ORGANIZATION_ROLES } from "@workspace/shared"
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
import { isNavigationItemActive } from "../navigation.utils"
import { AppBrand } from "./app-brand"

import { useOrganizationQuery } from "@/api/queries/organizations/useOrganizationQuery"
import { OrganizationSwitcher } from "@/modules/organizations/components/organization-switcher"

type AppSidebarProps = {
  organizationSlug: string
}

export function AppSidebar({ organizationSlug }: AppSidebarProps) {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const { isMobile, setOpenMobile } = useSidebar()
  const { data: organizationData } = useOrganizationQuery(organizationSlug)
  const isOwner = organizationData?.membership.role === ORGANIZATION_ROLES.OWNER
  const navigationItems = APP_NAVIGATION.filter(
    (item) => isOwner || !item.isOwnerOnly
  )

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
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton
                    render={<Link to={item.to} params={{ organizationSlug }} />}
                    isActive={isNavigationItemActive(
                      pathname,
                      organizationSlug,
                      item.path
                    )}
                    tooltip={t(item.labelKey)}
                    onClick={closeMobileSidebar}
                  >
                    <item.icon />
                    <span>{t(item.labelKey)}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
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
