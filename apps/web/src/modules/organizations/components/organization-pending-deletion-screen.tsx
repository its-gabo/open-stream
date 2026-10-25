import { ORGANIZATION_ROLES } from "@workspace/shared"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert"
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
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  CalendarClockIcon,
  LoaderCircleIcon,
  RotateCcwIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { formatOrganizationDeletionDate } from "../organizations.utils"

import type { OrganizationDetail, OrganizationRole } from "@/api/generated-api"

import { useOrganizationCancelDeletionMutation } from "@/api/mutations/organizations/useOrganizationCancelDeletionMutation"

type OrganizationPendingDeletionScreenProps = {
  organization: OrganizationDetail
  role: OrganizationRole
}

export function OrganizationPendingDeletionScreen({
  organization,
  role,
}: OrganizationPendingDeletionScreenProps) {
  const { t, i18n } = useTranslation()
  const [isCancelConfirmationOpen, setIsCancelConfirmationOpen] =
    useState(false)
  const { mutate: cancelDeletion, isPending: isCancelPending } =
    useOrganizationCancelDeletionMutation(organization.slug, {
      onSuccess: () => setIsCancelConfirmationOpen(false),
    })

  return (
    <div className="flex flex-1 items-center justify-center p-6 lg:p-10">
      <Card className="w-full max-w-2xl border-destructive/20">
        <CardHeader>
          <span className="mb-3 flex size-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
            <TriangleAlertIcon className="size-6" />
          </span>
          <CardTitle className="text-xl">
            {t("organizations.pending.title", {
              organization: organization.name,
            })}
          </CardTitle>
          <CardDescription className="max-w-xl leading-6">
            {t("organizations.pending.description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <Alert>
            <CalendarClockIcon className="size-4" />
            <AlertTitle>{t("organizations.pending.deadline")}</AlertTitle>
            <AlertDescription>
              {formatOrganizationDeletionDate(
                organization.scheduledDeletionAt,
                i18n.language
              )}
            </AlertDescription>
          </Alert>
          {role === ORGANIZATION_ROLES.OWNER ? (
            <div className="flex flex-col items-start gap-3 rounded-lg border bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium">
                  {t("organizations.pending.restore_title")}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("organizations.pending.restore_description")}
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => setIsCancelConfirmationOpen(true)}
                disabled={isCancelPending}
              >
                {isCancelPending ? (
                  <LoaderCircleIcon className="animate-spin" />
                ) : (
                  <RotateCcwIcon />
                )}
                {t("organizations.pending.cancel")}
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {t("organizations.pending.owner_only")}
            </p>
          )}
        </CardContent>
      </Card>
      <AlertDialog
        open={isCancelConfirmationOpen}
        onOpenChange={setIsCancelConfirmationOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("organizations.pending.cancel_dialog_title")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("organizations.pending.cancel_dialog_description", {
                organization: organization.name,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => cancelDeletion()}
              disabled={isCancelPending}
            >
              {isCancelPending && <LoaderCircleIcon className="animate-spin" />}
              {t("organizations.pending.cancel_confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
