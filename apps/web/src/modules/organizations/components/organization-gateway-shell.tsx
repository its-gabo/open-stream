import { Link } from "@tanstack/react-router"
import { Separator } from "@workspace/ui/components/separator"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@workspace/ui/components/sidebar"
import { BuildingIcon, LayoutDashboardIcon } from "lucide-react"
import { useTranslation } from "react-i18next"

import type { ReactNode } from "react"

import { AppBrand } from "@/modules/navigation/components/app-brand"
import { AppHeaderActions } from "@/modules/navigation/components/app-header-actions"
import { useSidebarStore } from "@/modules/navigation/navigation.store"

type OrganizationGatewayShellProps = {
  activePage: "inbox" | "new-organization"
  children: ReactNode
  hasMemberships: boolean
  preserveDestinationOnSignOut?: boolean
  title: string
}

export function OrganizationGatewayShell({
  activePage,
  children,
  hasMemberships,
  preserveDestinationOnSignOut = false,
  title,
}: OrganizationGatewayShellProps) {
  const { t } = useTranslation()
  const isSidebarOpen = useSidebarStore((state) => state.isOpen)
  const setIsSidebarOpen = useSidebarStore((state) => state.setIsOpen)

  return (
    <SidebarProvider open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
      <Sidebar collapsible="icon">
        <SidebarHeader className="gap-1">
          <AppBrand />
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>
              {t("organizations.gateway.navigation_label")}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-1">
                {hasMemberships && (
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      render={<Link to="/" />}
                      tooltip={t("organizations.invitations.back_to_workspace")}
                    >
                      <LayoutDashboardIcon />
                      <span>
                        {t("organizations.invitations.back_to_workspace")}
                      </span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
                <SidebarMenuItem>
                  <SidebarMenuButton
                    render={<Link to="/organizations/new" />}
                    isActive={activePage === "new-organization"}
                    tooltip={t("organizations.switcher.create")}
                  >
                    <BuildingIcon />
                    <span>{t("organizations.switcher.create")}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarRail />
      </Sidebar>

      <SidebarInset className="bg-slate-50/70">
        <header className="sticky top-0 z-10 flex h-10 shrink-0 items-center gap-2 border-b bg-background/90 px-2 backdrop-blur">
          <SidebarTrigger />
          <Separator orientation="vertical" className="mr-2 h-full" />
          <p className="min-w-0 truncate font-heading text-sm font-semibold">
            {title}
          </p>
          <AppHeaderActions
            preserveDestinationOnSignOut={preserveDestinationOnSignOut}
          />
        </header>
        <div className="flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
          <div className="mx-auto w-full max-w-5xl">{children}</div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
