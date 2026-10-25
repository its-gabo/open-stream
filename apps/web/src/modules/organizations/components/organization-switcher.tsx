import { useNavigate } from "@tanstack/react-router"
import { ORGANIZATION_STATUSES } from "@workspace/shared"
import { Badge } from "@workspace/ui/components/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@workspace/ui/components/sidebar"
import {
  BuildingIcon,
  CheckIcon,
  ChevronDownIcon,
  PlusIcon,
} from "lucide-react"
import { useTranslation } from "react-i18next"

import { formatOrganizationDeletionDate } from "../organizations.utils"

import { useOrganizationSelectMutation } from "@/api/mutations/organizations/useOrganizationSelectMutation"
import { useOrganizationContextQuery } from "@/api/queries/organizations/useOrganizationContextQuery"

type OrganizationSwitcherProps = {
  organizationSlug: string
}

export function OrganizationSwitcher({
  organizationSlug,
}: OrganizationSwitcherProps) {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { data: context } = useOrganizationContextQuery()
  const currentMembership = context?.memberships.find(
    (membership) => membership.organization.slug === organizationSlug
  )
  const { mutate: selectOrganization } = useOrganizationSelectMutation({
    onSuccess: (nextSlug) => {
      void navigate({
        to: "/$organizationSlug",
        params: { organizationSlug: nextSlug },
      })
    },
  })

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                className="data-open:bg-sidebar-accent"
                tooltip={currentMembership?.organization.name}
              />
            }
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              <BuildingIcon className="size-4" />
            </span>
            <span className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
              <span className="block truncate font-medium">
                {currentMembership?.organization.name ??
                  t("organizations.switcher.select")}
              </span>
              <span className="block truncate font-mono text-[10px] text-muted-foreground">
                {currentMembership
                  ? `/${currentMembership.organization.slug}`
                  : t("organizations.switcher.no_current")}
              </span>
            </span>
            <ChevronDownIcon className="ml-auto group-data-[collapsible=icon]:hidden" />
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="start" className="ml-3 w-72">
            <DropdownMenuGroup>
              <DropdownMenuLabel>
                {t("organizations.switcher.organizations")}
              </DropdownMenuLabel>
              {context?.memberships.map(({ membershipId, organization }) => {
                const isCurrent = organization.slug === organizationSlug
                const isPendingDeletion =
                  organization.status === ORGANIZATION_STATUSES.PENDING_DELETION

                return (
                  <DropdownMenuItem
                    key={membershipId}
                    onClick={() => selectOrganization(organization.slug)}
                    className="items-start py-2"
                  >
                    <BuildingIcon className="mt-0.5" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate">
                        {organization.name}
                      </span>
                      <span className="block truncate font-mono text-[10px] text-muted-foreground">
                        /{organization.slug}
                      </span>
                      {isPendingDeletion &&
                        organization.scheduledDeletionAt && (
                          <span className="mt-0.5 block text-[10px] text-destructive">
                            {t("organizations.switcher.deletes_on", {
                              date: formatOrganizationDeletionDate(
                                organization.scheduledDeletionAt,
                                i18n.language
                              ),
                            })}
                          </span>
                        )}
                    </span>
                    {isPendingDeletion && (
                      <Badge variant="destructive" className="h-5 text-[9px]">
                        {t("organizations.status.pending_deletion")}
                      </Badge>
                    )}
                    {!isPendingDeletion && isCurrent && (
                      <CheckIcon className="mt-0.5 text-primary" />
                    )}
                  </DropdownMenuItem>
                )
              })}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              disabled={context?.membershipLimit.reached}
              onClick={() => void navigate({ to: "/organizations/new" })}
            >
              <PlusIcon />
              <span>
                {t("organizations.switcher.create")}
                {context?.membershipLimit.reached && (
                  <span className="block text-[10px] text-muted-foreground">
                    {t("organizations.switcher.limit_reached", {
                      count: context.membershipLimit.maximum,
                    })}
                  </span>
                )}
              </span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
