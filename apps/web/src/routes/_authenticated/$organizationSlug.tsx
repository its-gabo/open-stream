import {
  Outlet,
  createFileRoute,
  useLocation,
  useNavigate,
} from "@tanstack/react-router"
import { useQueryClient } from "@tanstack/react-query"
import { ORGANIZATION_STATUSES } from "@workspace/shared"
import { Button } from "@workspace/ui/components/button"
import { Separator } from "@workspace/ui/components/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@workspace/ui/components/sidebar"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { P, match } from "ts-pattern"
import { useTranslation } from "react-i18next"

import { useOrganizationQuery } from "@/api/queries/organizations/useOrganizationQuery"
import { APP_NAME } from "@/lib/page-meta.constants"
import { AppHeaderActions } from "@/modules/navigation/components/app-header-actions"
import { AppSidebar } from "@/modules/navigation/components/app-sidebar"
import { APP_NAVIGATION } from "@/modules/navigation/navigation.constants"
import { useSidebarStore } from "@/modules/navigation/navigation.store"
import { OrganizationPendingDeletionScreen } from "@/modules/organizations/components/organization-pending-deletion-screen"
import { organizationQueryKey } from "@/modules/organizations/organizations.query-keys"
import { buildOrganizationPath } from "@/modules/organizations/organizations.utils"

export const Route = createFileRoute("/_authenticated/$organizationSlug")({
  component: OrganizationLayoutRoute,
})

function OrganizationLayoutRoute() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { pathname } = useLocation()
  const { organizationSlug } = Route.useParams()
  const { data, isPending: isOrganizationPending } =
    useOrganizationQuery(organizationSlug)
  const isSidebarOpen = useSidebarStore((state) => state.isOpen)
  const setIsSidebarOpen = useSidebarStore((state) => state.setIsOpen)

  const settingsPath = buildOrganizationPath(organizationSlug, "settings/")
  const currentItem =
    APP_NAVIGATION.find(
      (item) => buildOrganizationPath(organizationSlug, item.path) === pathname
    ) ??
    (pathname.startsWith(settingsPath)
      ? APP_NAVIGATION.find((item) => item.path.startsWith("settings/"))
      : undefined)

  const handleResolveOrganization = () => {
    queryClient.removeQueries({
      queryKey: organizationQueryKey(organizationSlug),
      exact: true,
    })

    void navigate({ to: "/", replace: true })
  }

  return (
    <SidebarProvider open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
      <AppSidebar organizationSlug={organizationSlug} />
      <SidebarInset className="bg-slate-50/70">
        <header className="sticky top-0 z-10 flex h-10 shrink-0 items-center gap-2 border-b bg-background/90 px-2 backdrop-blur">
          <SidebarTrigger />
          <Separator orientation="vertical" className="mr-2 h-full" />
          <p className="min-w-0 truncate font-heading text-sm font-semibold">
            {currentItem ? t(currentItem.labelKey) : APP_NAME}
          </p>
          <AppHeaderActions />
        </header>
        <div className="flex flex-1 flex-col">
          {match({ isOrganizationPending, organizationData: data })
            .with({ isOrganizationPending: true }, () => (
              <div className="space-y-4 p-6 lg:p-10">
                <Skeleton className="h-8 w-52" />
                <Skeleton className="h-40 w-full" />
              </div>
            ))
            .with({ organizationData: P.nullish }, () => (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
                <div>
                  <h1 className="font-heading text-xl font-semibold">
                    {t("organizations.not_found.title")}
                  </h1>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {t("organizations.not_found.description")}
                  </p>
                </div>
                <Button onClick={handleResolveOrganization}>
                  {t("organizations.not_found.continue")}
                </Button>
              </div>
            ))
            .with(
              {
                organizationData: {
                  organization: {
                    status: ORGANIZATION_STATUSES.PENDING_DELETION,
                  },
                },
              },
              ({ organizationData }) => (
                <OrganizationPendingDeletionScreen
                  organization={organizationData.organization}
                  role={organizationData.membership.role}
                />
              )
            )
            .otherwise(() => (
              <Outlet />
            ))}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
