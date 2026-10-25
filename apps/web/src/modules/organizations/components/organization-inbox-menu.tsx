import { useNavigate } from "@tanstack/react-router"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { BuildingIcon, ChevronRightIcon, InboxIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { match } from "ts-pattern"

import { ORGANIZATION_INBOX_TABS } from "../organizations.constants"
import { formatOrganizationInvitationExpiry } from "../organizations.utils"

import { useOrganizationContextQuery } from "@/api/queries/organizations/useOrganizationContextQuery"

export function OrganizationInboxMenu() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { data: context, isPending, isError } = useOrganizationContextQuery()
  const invitations = context?.pendingInvitations ?? []

  const openInbox = (invitationId?: string) => {
    void navigate({
      to: "/inbox",
      search: {
        tab: invitationId ? ORGANIZATION_INBOX_TABS.INVITATIONS : undefined,
        invitationId,
      },
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="relative px-2"
            aria-label={t("organizations.invitations.inbox_title")}
          />
        }
      >
        <InboxIcon className="size-4" />
        <span className="hidden sm:inline">
          {t("organizations.invitations.inbox_title")}
        </span>
        {invitations.length > 0 && (
          <Badge className="h-4 min-w-4 px-1 text-[10px]">
            {invitations.length}
          </Badge>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={6}
        className="mt-2 w-[min(22rem,calc(100vw-1rem))] p-1.5"
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex items-center justify-between gap-3 px-2 py-1.5">
            <span className="font-heading text-sm font-semibold text-foreground">
              {t("organizations.invitations.inbox_title")}
            </span>
            {invitations.length > 0 && (
              <Badge variant="secondary">
                {t("organizations.invitations.pending_count", {
                  count: invitations.length,
                })}
              </Badge>
            )}
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />

        {match({ isPending, isError, hasInvitations: invitations.length > 0 })
          .with({ isPending: true }, () => (
            <div className="space-y-3 px-2 py-2" aria-busy="true">
              {["w-4/5", "w-3/4"].map((width) => (
                <div key={width} className="flex items-center gap-3">
                  <Skeleton className="size-8 rounded-md" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className={`h-3 ${width}`} />
                    <Skeleton className="h-2.5 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ))
          .with({ isError: true }, () => (
            <div className="px-2 py-3">
              <p className="text-sm font-medium">
                {t("organizations.invitations.error_title")}
              </p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                {t("organizations.invitations.error_description")}
              </p>
            </div>
          ))
          .with({ hasInvitations: false }, () => (
            <div className="px-2 py-3">
              <p className="text-sm font-medium">
                {t("organizations.invitations.empty_title")}
              </p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                {t("organizations.invitations.empty_description")}
              </p>
            </div>
          ))
          .otherwise(() =>
            invitations.map((invitation) => (
              <DropdownMenuItem
                key={invitation.invitationId}
                className="items-start gap-3 px-2 py-2.5"
                onClick={() => openInbox(invitation.invitationId)}
              >
                <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <BuildingIcon className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm leading-5 font-medium">
                    {t("organizations.invitations.notification_title", {
                      organization: invitation.organization.name,
                    })}
                  </span>
                  <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
                    <span className="font-mono">
                      /{invitation.organization.slug}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>
                      {t("organizations.invitations.expires", {
                        date: formatOrganizationInvitationExpiry(
                          invitation.expiresAt,
                          i18n.language
                        ),
                      })}
                    </span>
                  </span>
                </span>
                <ChevronRightIcon className="mt-2 size-4 text-muted-foreground" />
              </DropdownMenuItem>
            ))
          )}

        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="justify-between px-2 py-1.5 font-medium"
          onClick={() => openInbox()}
        >
          {t("organizations.invitations.view_inbox")}
          <ChevronRightIcon />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
