import { createFileRoute, useNavigate } from "@tanstack/react-router"
import {
  ORGANIZATION_INVITATION_STATUSES,
  ORGANIZATION_ROLES,
} from "@workspace/shared"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@workspace/ui/components/alert-dialog"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Card, CardDescription, CardTitle } from "@workspace/ui/components/card"
import { Separator } from "@workspace/ui/components/separator"
import { Skeleton } from "@workspace/ui/components/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import {
  DoorOpenIcon,
  LoaderCircleIcon,
  RefreshCwIcon,
  Trash2Icon,
  UserMinusIcon,
  UserPlusIcon,
  UsersIcon,
} from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { P, match } from "ts-pattern"

import type { OrganizationTeamMember } from "@/api/generated-api"

import { useOrganizationCancelInvitationMutation } from "@/api/mutations/organizations/useOrganizationCancelInvitationMutation"
import { useOrganizationLeaveMutation } from "@/api/mutations/organizations/useOrganizationLeaveMutation"
import { useOrganizationRemoveMemberMutation } from "@/api/mutations/organizations/useOrganizationRemoveMemberMutation"
import { useOrganizationResendInvitationMutation } from "@/api/mutations/organizations/useOrganizationResendInvitationMutation"
import { useOrganizationQuery } from "@/api/queries/organizations/useOrganizationQuery"
import { useOrganizationTeamQuery } from "@/api/queries/organizations/useOrganizationTeamQuery"
import { createPageMeta } from "@/lib/page-meta"
import { OrganizationInviteForm } from "@/modules/organizations/components/organization-invite-form"
import { OrganizationSettingsHeader } from "@/modules/organizations/components/organization-settings-header"
import { formatOrganizationInvitationExpiry } from "@/modules/organizations/organizations.utils"

export const Route = createFileRoute(
  "/_authenticated/$organizationSlug/settings/team"
)({
  head: () => ({
    meta: createPageMeta({
      title: "Team and invitations",
      description:
        "Review organization members and manage workspace access and invitations.",
    }),
  }),
  component: OrganizationTeamRoute,
})

function OrganizationTeamRoute() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { organizationSlug } = Route.useParams()
  const { data: organizationData } = useOrganizationQuery(organizationSlug)
  const { data: teamData, isPending: isTeamPending } =
    useOrganizationTeamQuery(organizationSlug)
  const [memberToRemove, setMemberToRemove] =
    useState<OrganizationTeamMember | null>(null)
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false)
  const isOwner = organizationData?.membership.role === ORGANIZATION_ROLES.OWNER

  const { mutate: resendInvitation, isPending: isResendPending } =
    useOrganizationResendInvitationMutation(organizationSlug)
  const { mutate: cancelInvitation, isPending: isCancelPending } =
    useOrganizationCancelInvitationMutation(organizationSlug)
  const { mutate: removeMember, isPending: isRemovePending } =
    useOrganizationRemoveMemberMutation(organizationSlug, {
      onSuccess: () => setMemberToRemove(null),
    })
  const { mutate: leaveOrganization, isPending: isLeavePending } =
    useOrganizationLeaveMutation(organizationSlug, {
      onSuccess: () => void navigate({ to: "/", replace: true }),
    })

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
        <div className="mx-auto w-full max-w-5xl">
          <Card className="gap-0 overflow-hidden py-0">
            <OrganizationSettingsHeader organizationSlug={organizationSlug} />
            {match({ isTeamPending, team: teamData, organizationData })
              .with({ isTeamPending: true }, () => (
                <>
                  <section className="p-4 sm:p-5">
                    <Skeleton className="h-64 w-full" />
                  </section>
                  <Separator />
                  <section className="p-4 sm:p-5">
                    <Skeleton className="h-56 w-full" />
                  </section>
                </>
              ))
              .with(
                { team: P.nonNullable, organizationData: P.nonNullable },
                ({ team }) => (
                  <>
                    <section className="flex flex-col gap-4 p-4 sm:p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <UsersIcon className="size-5" />
                          </span>
                          <div>
                            <CardTitle>
                              {t("organizations.team.members")}
                            </CardTitle>
                            <CardDescription>
                              {t("organizations.team.members_description")}
                            </CardDescription>
                          </div>
                        </div>
                        <Badge variant="secondary">{team.members.length}</Badge>
                      </div>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>
                              {t("organizations.team.name")}
                            </TableHead>
                            <TableHead>
                              {t("organizations.team.email")}
                            </TableHead>
                            <TableHead>
                              {t("organizations.team.role")}
                            </TableHead>
                            {isOwner && (
                              <TableHead className="text-right">
                                {t("organizations.team.actions")}
                              </TableHead>
                            )}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {team.members.map((member) => (
                            <TableRow key={member.membershipId}>
                              <TableCell className="font-medium">
                                {member.name}
                              </TableCell>
                              <TableCell>{member.email}</TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    member.role === ORGANIZATION_ROLES.OWNER
                                      ? "default"
                                      : "secondary"
                                  }
                                >
                                  {t(`organizations.roles.${member.role}`)}
                                </Badge>
                              </TableCell>
                              {isOwner && (
                                <TableCell className="text-right">
                                  {member.role ===
                                    ORGANIZATION_ROLES.MEMBER && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="text-destructive"
                                      onClick={() => setMemberToRemove(member)}
                                    >
                                      <UserMinusIcon />
                                      {t("organizations.team.remove")}
                                    </Button>
                                  )}
                                </TableCell>
                              )}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      {!isOwner && (
                        <div className="mt-5 flex flex-col gap-3 rounded-lg border border-dashed p-4 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="font-medium">
                              {t("organizations.team.leave_title")}
                            </p>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {t("organizations.team.leave_description")}
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            className="text-destructive"
                            onClick={() => setIsLeaveDialogOpen(true)}
                          >
                            <DoorOpenIcon />
                            {t("organizations.team.leave")}
                          </Button>
                        </div>
                      )}
                    </section>

                    {isOwner && (
                      <>
                        <Separator />
                        <section className="flex flex-col gap-4 p-4 sm:p-5">
                          <div className="flex items-start gap-3">
                            <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                              <UserPlusIcon className="size-5" />
                            </span>
                            <div>
                              <CardTitle>
                                {t("organizations.team.invitations")}
                              </CardTitle>
                              <CardDescription>
                                {t(
                                  "organizations.team.invitations_description"
                                )}
                              </CardDescription>
                            </div>
                          </div>
                          <div className="space-y-6">
                            <OrganizationInviteForm
                              organizationSlug={organizationSlug}
                            />
                            {team.invitations.length === 0 ? (
                              <div className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
                                {t("organizations.team.invitations_empty")}
                              </div>
                            ) : (
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>
                                      {t("organizations.team.email")}
                                    </TableHead>
                                    <TableHead>
                                      {t("organizations.team.status")}
                                    </TableHead>
                                    <TableHead>
                                      {t("organizations.team.expires")}
                                    </TableHead>
                                    <TableHead className="text-right">
                                      {t("organizations.team.actions")}
                                    </TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {team.invitations.map((invitation) => (
                                    <TableRow key={invitation.invitationId}>
                                      <TableCell className="font-medium">
                                        {invitation.email}
                                      </TableCell>
                                      <TableCell>
                                        <Badge
                                          variant={
                                            invitation.status ===
                                            ORGANIZATION_INVITATION_STATUSES.EXPIRED
                                              ? "destructive"
                                              : "secondary"
                                          }
                                        >
                                          {t(
                                            `organizations.team.${invitation.status}`
                                          )}
                                        </Badge>
                                      </TableCell>
                                      <TableCell>
                                        {formatOrganizationInvitationExpiry(
                                          invitation.expiresAt,
                                          i18n.language
                                        )}
                                      </TableCell>
                                      <TableCell>
                                        <div className="flex justify-end gap-1">
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() =>
                                              resendInvitation(
                                                invitation.invitationId
                                              )
                                            }
                                            disabled={
                                              isResendPending || isCancelPending
                                            }
                                          >
                                            {isResendPending ? (
                                              <LoaderCircleIcon className="animate-spin" />
                                            ) : (
                                              <RefreshCwIcon />
                                            )}
                                            {t("organizations.team.resend")}
                                          </Button>
                                          {invitation.status ===
                                            ORGANIZATION_INVITATION_STATUSES.PENDING && (
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              className="text-destructive"
                                              onClick={() =>
                                                cancelInvitation(
                                                  invitation.invitationId
                                                )
                                              }
                                              disabled={
                                                isResendPending ||
                                                isCancelPending
                                              }
                                            >
                                              <Trash2Icon />
                                              {t("organizations.team.cancel")}
                                            </Button>
                                          )}
                                        </div>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            )}
                          </div>
                        </section>
                      </>
                    )}
                  </>
                )
              )
              .otherwise(() => (
                <section className="p-4 sm:p-5">
                  <CardTitle>{t("organizations.team.error_title")}</CardTitle>
                  <CardDescription>
                    {t("organizations.team.error_description")}
                  </CardDescription>
                </section>
              ))}
          </Card>
        </div>
      </div>

      <AlertDialog
        open={Boolean(memberToRemove)}
        onOpenChange={(open) => {
          if (!open) setMemberToRemove(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("organizations.team.remove_dialog_title")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("organizations.team.remove_dialog_description", {
                name: memberToRemove?.name,
                email: memberToRemove?.email,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isRemovePending}
              onClick={() => {
                if (memberToRemove) removeMember(memberToRemove.membershipId)
              }}
            >
              {isRemovePending && <LoaderCircleIcon className="animate-spin" />}
              {t("organizations.team.remove")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isLeaveDialogOpen} onOpenChange={setIsLeaveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("organizations.team.leave_dialog_title")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("organizations.team.leave_dialog_description", {
                organization: organizationData?.organization.name,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isLeavePending}
              onClick={() => leaveOrganization()}
            >
              {isLeavePending && <LoaderCircleIcon className="animate-spin" />}
              {t("organizations.team.leave")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
