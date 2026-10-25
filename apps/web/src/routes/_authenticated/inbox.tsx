import { Link, createFileRoute, useNavigate } from "@tanstack/react-router"
import { Badge } from "@workspace/ui/components/badge"
import { Button, buttonVariants } from "@workspace/ui/components/button"
import { Card } from "@workspace/ui/components/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@workspace/ui/components/empty"
import { Skeleton } from "@workspace/ui/components/skeleton"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs"
import { cn } from "@workspace/ui/lib/utils"
import {
  ArrowRightIcon,
  BellIcon,
  BuildingIcon,
  CheckIcon,
  CircleCheckIcon,
  ClockIcon,
  LoaderCircleIcon,
  LogOutIcon,
  MailIcon,
  XIcon,
} from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { match } from "ts-pattern"

import type { OrganizationSummary } from "@/api/generated-api"

import { useAuthSignOutMutation } from "@/api/mutations/auth/useAuthSignOutMutation"
import { useOrganizationAcceptInvitationMutation } from "@/api/mutations/organizations/useOrganizationAcceptInvitationMutation"
import { useOrganizationDeclineInvitationMutation } from "@/api/mutations/organizations/useOrganizationDeclineInvitationMutation"
import { useOrganizationContextQuery } from "@/api/queries/organizations/useOrganizationContextQuery"
import { createPageMeta } from "@/lib/page-meta"
import { OrganizationGatewayShell } from "@/modules/organizations/components/organization-gateway-shell"
import { ORGANIZATION_INBOX_TABS } from "@/modules/organizations/organizations.constants"
import { inboxSearchSchema } from "@/modules/organizations/organizations.schemas"
import { formatOrganizationInvitationExpiry } from "@/modules/organizations/organizations.utils"

export const Route = createFileRoute("/_authenticated/inbox")({
  validateSearch: inboxSearchSchema,
  head: () => ({
    meta: createPageMeta({
      title: "Inbox",
      description:
        "Review notifications and manage your organization invitations.",
    }),
  }),
  component: InboxRoute,
})

function InboxRoute() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { tab, invitationId: linkedInvitationId } = Route.useSearch()
  const activeTab =
    tab === ORGANIZATION_INBOX_TABS.GENERAL
      ? ORGANIZATION_INBOX_TABS.GENERAL
      : ORGANIZATION_INBOX_TABS.INVITATIONS
  const [acceptedOrganizations, setAcceptedOrganizations] = useState<
    OrganizationSummary[]
  >([])
  const { data: context, isPending, isError } = useOrganizationContextQuery()
  const invitations = context?.pendingInvitations ?? []
  const hasMemberships = Boolean(context?.memberships.length)
  const isLinkedInvitationVisible =
    !linkedInvitationId ||
    invitations.some(
      (invitation) => invitation.invitationId === linkedInvitationId
    )

  const handleTabChange = (value: unknown) => {
    if (
      value !== ORGANIZATION_INBOX_TABS.GENERAL &&
      value !== ORGANIZATION_INBOX_TABS.INVITATIONS
    ) {
      return
    }

    void navigate({
      to: "/inbox",
      search: {
        tab: value === ORGANIZATION_INBOX_TABS.GENERAL ? value : undefined,
      },
      replace: true,
    })
  }

  const {
    mutate: acceptInvitation,
    isPending: isAcceptPending,
    variables: acceptingInvitationId,
  } = useOrganizationAcceptInvitationMutation({
    onSuccess: (organization) => {
      if (invitations.length <= 1) {
        void navigate({
          to: "/$organizationSlug",
          params: { organizationSlug: organization.slug },
          replace: true,
        })
        return
      }

      setAcceptedOrganizations((current) => [...current, organization])
    },
  })
  const {
    mutate: declineInvitation,
    isPending: isDeclinePending,
    variables: decliningInvitationId,
  } = useOrganizationDeclineInvitationMutation({
    onSuccess: () => {
      if (invitations.length > 1) return

      void navigate({ to: "/", replace: true })
    },
  })
  const { mutate: signOut, isPending: isSignOutPending } =
    useAuthSignOutMutation({
      onSuccess: () => {
        void navigate({
          to: "/sign-in",
          search: {
            redirectTo: `/inbox?invitationId=${linkedInvitationId ?? ""}`,
          },
          replace: true,
        })
      },
    })

  return (
    <OrganizationGatewayShell
      activePage="inbox"
      title={t("organizations.invitations.title")}
      hasMemberships={hasMemberships}
      preserveDestinationOnSignOut
    >
      <Card className="gap-0 overflow-hidden py-0">
        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="gap-0"
        >
          <TabsList
            variant="line"
            aria-label={t("organizations.invitations.tabs_label")}
            className="h-12 w-full justify-start gap-5 border-b px-4 sm:px-5"
          >
            <TabsTrigger
              value={ORGANIZATION_INBOX_TABS.GENERAL}
              className="h-full flex-none px-0"
            >
              {t("organizations.invitations.general_tab")}
            </TabsTrigger>
            <TabsTrigger
              value={ORGANIZATION_INBOX_TABS.INVITATIONS}
              className="h-full flex-none px-0"
            >
              {t("organizations.invitations.invitations_tab")}
              {invitations.length > 0 && (
                <Badge
                  variant="secondary"
                  className="h-5 min-w-5 px-1.5 text-[11px]"
                >
                  {invitations.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value={ORGANIZATION_INBOX_TABS.GENERAL}>
            <Empty className="min-h-72 rounded-none border-0 py-14">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <BellIcon />
                </EmptyMedia>
                <EmptyTitle>
                  {t("organizations.invitations.general_empty_title")}
                </EmptyTitle>
                <EmptyDescription>
                  {t("organizations.invitations.general_empty_description")}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </TabsContent>

          <TabsContent
            value={ORGANIZATION_INBOX_TABS.INVITATIONS}
            className="divide-y"
          >
            {acceptedOrganizations.map((organization) => (
              <article
                key={organization.id}
                className="flex flex-col gap-3 bg-emerald-50/60 px-4 py-4 sm:flex-row sm:items-center sm:px-5"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <CircleCheckIcon className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-emerald-950">
                    {t("organizations.invitations.accepted", {
                      organization: organization.name,
                    })}
                  </p>
                  <p className="mt-0.5 truncate font-mono text-xs text-emerald-800/70">
                    /{organization.slug}
                  </p>
                </div>
                <Link
                  to="/$organizationSlug"
                  params={{ organizationSlug: organization.slug }}
                  className={buttonVariants({ size: "sm", variant: "outline" })}
                >
                  {t("organizations.invitations.open")}
                  <ArrowRightIcon />
                </Link>
              </article>
            ))}

            {match({
              isPending,
              isError,
              isLinkedInvitationVisible,
              hasInvitations: invitations.length > 0,
            })
              .with({ isPending: true }, () =>
                [0, 1, 2].map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 px-4 py-4 sm:px-5"
                  >
                    <Skeleton className="size-9 shrink-0 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-56 max-w-full" />
                      <Skeleton className="h-3 w-36 max-w-full" />
                    </div>
                    <Skeleton className="hidden h-7 w-32 sm:block" />
                  </div>
                ))
              )
              .with({ isError: true }, () => (
                <div className="flex flex-col items-center px-4 py-12 text-center">
                  <span className="mb-3 flex size-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                    <MailIcon className="size-5" />
                  </span>
                  <p className="font-medium">
                    {t("organizations.invitations.error_title")}
                  </p>
                  <p className="mt-1 max-w-md text-sm leading-6 text-muted-foreground">
                    {t("organizations.invitations.error_description")}
                  </p>
                </div>
              ))
              .with({ isLinkedInvitationVisible: false }, () => (
                <div className="flex flex-col items-center px-4 py-12 text-center">
                  <span className="mb-3 flex size-10 items-center justify-center rounded-full bg-amber-100 text-amber-800">
                    <MailIcon className="size-5" />
                  </span>
                  <p className="font-medium">
                    {t("organizations.invitations.mismatch_title")}
                  </p>
                  <p className="mt-1 max-w-md text-sm leading-6 text-muted-foreground">
                    {t("organizations.invitations.mismatch_description")}
                  </p>
                  <Button
                    className="mt-4"
                    variant="outline"
                    onClick={() => signOut()}
                    disabled={isSignOutPending}
                  >
                    {isSignOutPending ? (
                      <LoaderCircleIcon className="animate-spin" />
                    ) : (
                      <LogOutIcon />
                    )}
                    {t("organizations.invitations.sign_out_continue")}
                  </Button>
                </div>
              ))
              .with({ hasInvitations: false }, () => (
                <div className="flex flex-col items-center px-4 py-12 text-center">
                  <span className="mb-3 flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <CheckIcon className="size-5" />
                  </span>
                  <p className="font-medium">
                    {t("organizations.invitations.empty_title")}
                  </p>
                  <p className="mt-1 max-w-md text-sm leading-6 text-muted-foreground">
                    {t("organizations.invitations.empty_description")}
                  </p>
                  <Link
                    to={hasMemberships ? "/" : "/organizations/new"}
                    className={buttonVariants({ className: "mt-4" })}
                  >
                    {hasMemberships
                      ? t("organizations.invitations.back_to_workspace")
                      : t("organizations.invitations.create_organization")}
                  </Link>
                </div>
              ))
              .otherwise(() =>
                invitations.map((invitation) => {
                  const isLinkedInvitation =
                    invitation.invitationId === linkedInvitationId
                  const isAcceptingInvitation =
                    isAcceptPending &&
                    acceptingInvitationId === invitation.invitationId
                  const isDecliningInvitation =
                    isDeclinePending &&
                    decliningInvitationId === invitation.invitationId

                  return (
                    <article
                      key={invitation.invitationId}
                      className={cn(
                        "flex flex-col gap-3 px-4 py-4 transition-colors hover:bg-muted/30 sm:flex-row sm:items-center sm:px-5",
                        isLinkedInvitation && "bg-primary/[0.035]"
                      )}
                    >
                      <span className="relative flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <BuildingIcon className="size-4" />
                        {isLinkedInvitation && (
                          <span className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full border-2 border-background bg-primary" />
                        )}
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium">
                            {t("organizations.invitations.notification_title", {
                              organization: invitation.organization.name,
                            })}
                          </p>
                          <Badge variant="outline">
                            {t("organizations.roles.member")}
                          </Badge>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          <span className="font-mono">
                            /{invitation.organization.slug}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <ClockIcon className="size-3.5" />
                            {t("organizations.invitations.expires", {
                              date: formatOrganizationInvitationExpiry(
                                invitation.expiresAt,
                                i18n.language
                              ),
                            })}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            declineInvitation(invitation.invitationId)
                          }
                          disabled={isAcceptPending || isDeclinePending}
                        >
                          {isDecliningInvitation ? (
                            <LoaderCircleIcon className="animate-spin" />
                          ) : (
                            <XIcon />
                          )}
                          {t("organizations.invitations.decline")}
                        </Button>
                        <Button
                          size="sm"
                          onClick={() =>
                            acceptInvitation(invitation.invitationId)
                          }
                          disabled={isAcceptPending || isDeclinePending}
                        >
                          {isAcceptingInvitation ? (
                            <LoaderCircleIcon className="animate-spin" />
                          ) : (
                            <CheckIcon />
                          )}
                          {t("organizations.invitations.accept")}
                        </Button>
                      </div>
                    </article>
                  )
                })
              )}
          </TabsContent>
        </Tabs>
      </Card>
    </OrganizationGatewayShell>
  )
}
