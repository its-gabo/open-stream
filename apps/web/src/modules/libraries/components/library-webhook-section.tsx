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
import { CardDescription, CardTitle } from "@workspace/ui/components/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import {
  EllipsisIcon,
  LoaderCircleIcon,
  PencilIcon,
  PlusIcon,
  RefreshCwIcon,
  SendIcon,
  Trash2Icon,
  WebhookIcon,
} from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { LibraryApiKeySecretDialog } from "./library-api-key-secret-dialog"
import { LibraryWebhookEvents } from "./library-webhook-events"
import { LibraryWebhookUrlDialog } from "./library-webhook-url-dialog"

import type { LibraryWebhook } from "@/api/generated-api"

import { useLibraryWebhookDeleteMutation } from "@/api/mutations/libraries/useLibraryWebhookDeleteMutation"
import { useLibraryWebhookSecretRollMutation } from "@/api/mutations/libraries/useLibraryWebhookSecretRollMutation"
import { useLibraryWebhookTestMutation } from "@/api/mutations/libraries/useLibraryWebhookTestMutation"

type LibraryWebhookSectionProps = {
  organizationSlug: string
  libraryId: string
  webhook: LibraryWebhook | null
}

/** The URL the library's events are sent to and its signing secret, changed through dialogs. */
export function LibraryWebhookSection({
  organizationSlug,
  libraryId,
  webhook,
}: LibraryWebhookSectionProps) {
  const { t, i18n } = useTranslation()
  const [shownSecret, setShownSecret] = useState<string | null>(null)
  const [isUrlDialogOpen, setIsUrlDialogOpen] = useState(false)
  const [isRollDialogOpen, setIsRollDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const { mutate: rollSecret, isPending: isRollPending } =
    useLibraryWebhookSecretRollMutation(organizationSlug, libraryId, {
      onSuccess: ({ signingSecret }) => {
        setIsRollDialogOpen(false)
        setShownSecret(signingSecret)
      },
    })
  const { mutate: deleteWebhook, isPending: isDeletePending } =
    useLibraryWebhookDeleteMutation(organizationSlug, libraryId, {
      onSuccess: () => setIsDeleteDialogOpen(false),
    })
  const { mutate: sendTest, isPending: isTestPending } =
    useLibraryWebhookTestMutation(organizationSlug, libraryId)

  return (
    <section className="flex flex-col gap-4 p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <WebhookIcon className="size-5" />
        </span>
        <div>
          <CardTitle>{t("libraries.webhooks.title")}</CardTitle>
          <CardDescription>
            {t("libraries.webhooks.description")}
          </CardDescription>
        </div>
      </div>
      {webhook ? (
        <div className="flex flex-col gap-3 rounded-lg border p-3 sm:p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 flex-1 items-center gap-2.5">
              <span
                className="size-2 shrink-0 rounded-full bg-emerald-500"
                aria-hidden
              />
              <span
                className="truncate text-sm font-medium"
                title={webhook.url}
              >
                {webhook.url}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="outline"
                disabled={isTestPending}
                onClick={() => sendTest()}
              >
                {isTestPending ? (
                  <LoaderCircleIcon className="animate-spin" />
                ) : (
                  <SendIcon />
                )}
                {t("libraries.webhooks.send_test")}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      aria-label={t("libraries.webhooks.more_actions")}
                    />
                  }
                >
                  <EllipsisIcon />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuItem onClick={() => setIsUrlDialogOpen(true)}>
                    <PencilIcon />
                    {t("libraries.webhooks.edit_url")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setIsRollDialogOpen(true)}>
                    <RefreshCwIcon />
                    {t("libraries.webhooks.roll")}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => setIsDeleteDialogOpen(true)}
                  >
                    <Trash2Icon />
                    {t("libraries.webhooks.delete")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
            <span>
              {t("libraries.webhooks.signing_secret")}:{" "}
              <code className="font-mono text-foreground">
                whsec_…{webhook.signingSecretHint}
              </code>
            </span>
            <span>
              {t("libraries.webhooks.added_on", {
                date: new Intl.DateTimeFormat(i18n.language, {
                  dateStyle: "medium",
                }).format(new Date(webhook.createdAt)),
              })}
            </span>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-start gap-3 rounded-lg border border-dashed p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            {t("libraries.webhooks.empty")}
          </p>
          <Button onClick={() => setIsUrlDialogOpen(true)}>
            <PlusIcon />
            {t("libraries.webhooks.create")}
          </Button>
        </div>
      )}

      <LibraryWebhookEvents />

      <LibraryWebhookUrlDialog
        organizationSlug={organizationSlug}
        libraryId={libraryId}
        webhook={webhook}
        open={isUrlDialogOpen}
        onOpenChange={setIsUrlDialogOpen}
        onCreated={setShownSecret}
      />
      <LibraryApiKeySecretDialog
        secret={shownSecret}
        onClose={() => setShownSecret(null)}
        title={t("libraries.webhooks.secret_title")}
        description={t("libraries.webhooks.secret_description")}
      />

      <AlertDialog open={isRollDialogOpen} onOpenChange={setIsRollDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("libraries.webhooks.roll_title")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("libraries.webhooks.roll_description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isRollPending}
              onClick={() => rollSecret()}
            >
              {isRollPending && <LoaderCircleIcon className="animate-spin" />}
              {t("libraries.webhooks.roll")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("libraries.webhooks.delete_title")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("libraries.webhooks.delete_description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isDeletePending}
              onClick={() => deleteWebhook()}
            >
              {isDeletePending && <LoaderCircleIcon className="animate-spin" />}
              {t("libraries.webhooks.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}
