import { Link, createFileRoute } from "@tanstack/react-router"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert"
import { buttonVariants } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  CircleCheckIcon,
  LoaderCircleIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { match } from "ts-pattern"

import { useOrganizationDeletionActionMutation } from "@/api/mutations/organizations/useOrganizationDeletionActionMutation"
import { APP_NAME } from "@/lib/page-meta.constants"
import { createPageMeta } from "@/lib/page-meta"
import {
  ORGANIZATION_DELETION_ACTIONS,
  ORGANIZATION_DELETION_ACTION_STATES,
} from "@/modules/organizations/organizations.constants"
import { organizationDeletionSearchSchema } from "@/modules/organizations/organizations.schemas"

import type { OrganizationDeletionActionState } from "@/modules/organizations/organizations.types"

export const Route = createFileRoute("/_authenticated/organization-deletion")({
  validateSearch: organizationDeletionSearchSchema,
  head: () => ({
    meta: createPageMeta({
      title: "Organization deletion action",
      description:
        "Verify the organization deletion request and apply the requested action.",
    }),
  }),
  component: OrganizationDeletionRoute,
})

function OrganizationDeletionRoute() {
  const { t } = useTranslation()
  const { action, token } = Route.useSearch()
  const hasStarted = useRef(false)
  const [state, setState] = useState<OrganizationDeletionActionState>(
    ORGANIZATION_DELETION_ACTION_STATES.PENDING
  )
  const { mutate: runDeletionAction } = useOrganizationDeletionActionMutation({
    onSuccess: () => setState(ORGANIZATION_DELETION_ACTION_STATES.SUCCESS),
    onError: () => setState(ORGANIZATION_DELETION_ACTION_STATES.ERROR),
  })

  useEffect(() => {
    if (hasStarted.current) return
    hasStarted.current = true

    if (!action || !token) {
      setState(ORGANIZATION_DELETION_ACTION_STATES.ERROR)
      return
    }

    runDeletionAction({ action, token })
  }, [action, runDeletionAction, token])

  const isCancel = action === ORGANIZATION_DELETION_ACTIONS.CANCEL

  return (
    <main className="grid min-h-svh place-items-center bg-muted/40 px-4 py-8">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <span className="mb-3 flex size-11 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
            <TriangleAlertIcon className="size-5" />
          </span>
          <CardTitle>{t("organizations.deletion_action.title")}</CardTitle>
          <CardDescription>
            {t("organizations.deletion_action.description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {match(state)
            .with(ORGANIZATION_DELETION_ACTION_STATES.PENDING, () => (
              <div className="flex items-center gap-3 rounded-lg border bg-muted/50 px-4 py-3 text-sm">
                <LoaderCircleIcon className="size-4 animate-spin" />
                {t("organizations.deletion_action.pending")}
              </div>
            ))
            .with(ORGANIZATION_DELETION_ACTION_STATES.SUCCESS, () => (
              <Alert className="border-emerald-200 bg-emerald-50 text-emerald-950">
                <CircleCheckIcon className="size-4 text-emerald-700" />
                <AlertTitle>
                  {isCancel
                    ? t("organizations.deletion_action.cancel_success_title")
                    : t("organizations.deletion_action.delete_success_title")}
                </AlertTitle>
                <AlertDescription>
                  {isCancel
                    ? t("organizations.deletion_action.cancel_success")
                    : t("organizations.deletion_action.delete_success")}
                </AlertDescription>
              </Alert>
            ))
            .with(ORGANIZATION_DELETION_ACTION_STATES.ERROR, () => (
              <Alert variant="destructive">
                <AlertTitle>
                  {t("organizations.deletion_action.error_title")}
                </AlertTitle>
                <AlertDescription>
                  {t("organizations.deletion_action.error_description")}
                </AlertDescription>
              </Alert>
            ))
            .exhaustive()}
          {state !== ORGANIZATION_DELETION_ACTION_STATES.PENDING && (
            <Link to="/" className={buttonVariants()}>
              {t("organizations.deletion_action.continue", {
                app: APP_NAME,
              })}
            </Link>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
