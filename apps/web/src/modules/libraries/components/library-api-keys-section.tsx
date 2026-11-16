import { LIBRARY_API_KEY_LIMITS } from "@workspace/shared"
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
import { CardDescription, CardTitle } from "@workspace/ui/components/card"
import { Label } from "@workspace/ui/components/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import {
  KeyRoundIcon,
  LoaderCircleIcon,
  PencilIcon,
  PlusIcon,
  RefreshCwIcon,
  Trash2Icon,
} from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { LIBRARY_API_KEY_SCOPE_TRANSLATION_KEYS } from "../libraries.constants"
import { LibraryApiKeyFormDialog } from "./library-api-key-form-dialog"
import { LibraryApiKeySecretDialog } from "./library-api-key-secret-dialog"

import type { LibraryApiAccess, LibraryApiKey } from "@/api/generated-api"

import { useLibraryApiKeyDeleteMutation } from "@/api/mutations/libraries/useLibraryApiKeyDeleteMutation"
import { useLibraryApiKeyRollMutation } from "@/api/mutations/libraries/useLibraryApiKeyRollMutation"
import { CopyField } from "@/components/copy-field"

type LibraryApiKeysSectionProps = {
  organizationSlug: string
  apiAccess: LibraryApiAccess
}

const LIBRARY_ID_FIELD_ID = "library-api-library-id"
const API_URL_FIELD_ID = "library-api-url"

/** The library's API identifier and its keys, each limited to its scopes. */
export function LibraryApiKeysSection({
  organizationSlug,
  apiAccess,
}: LibraryApiKeysSectionProps) {
  const { t, i18n } = useTranslation()
  const { libraryId, apiKeys } = apiAccess
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [keyToEdit, setKeyToEdit] = useState<LibraryApiKey | null>(null)
  const [keyToRoll, setKeyToRoll] = useState<LibraryApiKey | null>(null)
  const [keyToDelete, setKeyToDelete] = useState<LibraryApiKey | null>(null)
  const [shownSecret, setShownSecret] = useState<string | null>(null)
  const isAtKeyLimit = apiKeys.length >= LIBRARY_API_KEY_LIMITS.MAX_PER_LIBRARY
  const formatDate = (value: string) =>
    new Intl.DateTimeFormat(i18n.language, { dateStyle: "medium" }).format(
      new Date(value)
    )

  const { mutate: rollApiKey, isPending: isRollPending } =
    useLibraryApiKeyRollMutation(organizationSlug, libraryId, {
      onSuccess: ({ secret }) => {
        setKeyToRoll(null)
        setShownSecret(secret)
      },
    })
  const { mutate: deleteApiKey, isPending: isDeletePending } =
    useLibraryApiKeyDeleteMutation(organizationSlug, libraryId, {
      onSuccess: () => setKeyToDelete(null),
    })

  return (
    <section className="flex flex-col gap-4 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <KeyRoundIcon className="size-5" />
          </span>
          <div>
            <CardTitle>{t("libraries.api.keys.title")}</CardTitle>
            <CardDescription>
              {t("libraries.api.keys.description")}
            </CardDescription>
          </div>
        </div>
        <Button
          disabled={isAtKeyLimit}
          title={
            isAtKeyLimit
              ? t("libraries.api.keys.limit_reached", {
                  max: LIBRARY_API_KEY_LIMITS.MAX_PER_LIBRARY,
                })
              : undefined
          }
          onClick={() => setIsCreateDialogOpen(true)}
        >
          <PlusIcon />
          {t("libraries.api.keys.create")}
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor={LIBRARY_ID_FIELD_ID}>
            {t("libraries.api.keys.library_id")}
          </Label>
          <CopyField id={LIBRARY_ID_FIELD_ID} value={libraryId} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor={API_URL_FIELD_ID}>
            {t("libraries.api.keys.api_url")}
          </Label>
          <CopyField id={API_URL_FIELD_ID} value={apiAccess.apiUrl} />
        </div>
      </div>
      {apiKeys.length === 0 ? (
        <div className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
          {t("libraries.api.keys.empty")}
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("libraries.api.keys.columns.name")}</TableHead>
              <TableHead>{t("libraries.api.keys.columns.access")}</TableHead>
              <TableHead>{t("libraries.api.keys.columns.last_used")}</TableHead>
              <TableHead className="text-right">
                {t("libraries.api.keys.columns.actions")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {apiKeys.map((apiKey) => (
              <TableRow key={apiKey.id}>
                <TableCell>
                  <div className="font-medium">{apiKey.name}</div>
                  <div className="font-mono text-xs text-muted-foreground">
                    osk_…{apiKey.hint}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex max-w-72 flex-wrap gap-1">
                    {apiKey.scopes.map((scope) => (
                      <Badge key={scope} variant="secondary">
                        {t(
                          `libraries.api.scopes.${LIBRARY_API_KEY_SCOPE_TRANSLATION_KEYS[scope]}.label`
                        )}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {apiKey.lastUsedAt
                    ? formatDate(apiKey.lastUsedAt)
                    : t("libraries.api.keys.never_used")}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setKeyToEdit(apiKey)}
                    >
                      <PencilIcon />
                      {t("libraries.api.keys.edit")}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setKeyToRoll(apiKey)}
                    >
                      <RefreshCwIcon />
                      {t("libraries.api.keys.roll")}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => setKeyToDelete(apiKey)}
                    >
                      <Trash2Icon />
                      {t("libraries.api.keys.delete")}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <LibraryApiKeyFormDialog
        organizationSlug={organizationSlug}
        libraryId={libraryId}
        apiKey={null}
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onCreated={setShownSecret}
      />
      <LibraryApiKeyFormDialog
        organizationSlug={organizationSlug}
        libraryId={libraryId}
        apiKey={keyToEdit}
        open={Boolean(keyToEdit)}
        onOpenChange={(open) => {
          if (!open) setKeyToEdit(null)
        }}
        onCreated={setShownSecret}
      />
      <LibraryApiKeySecretDialog
        secret={shownSecret}
        onClose={() => setShownSecret(null)}
      />

      <AlertDialog
        open={Boolean(keyToRoll)}
        onOpenChange={(open) => {
          if (!open) setKeyToRoll(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("libraries.api.keys.roll_title", { name: keyToRoll?.name })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("libraries.api.keys.roll_description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isRollPending}
              onClick={() => {
                if (keyToRoll) rollApiKey(keyToRoll.id)
              }}
            >
              {isRollPending && <LoaderCircleIcon className="animate-spin" />}
              {t("libraries.api.keys.roll")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={Boolean(keyToDelete)}
        onOpenChange={(open) => {
          if (!open) setKeyToDelete(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("libraries.api.keys.delete_title", {
                name: keyToDelete?.name,
              })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("libraries.api.keys.delete_description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isDeletePending}
              onClick={() => {
                if (keyToDelete) deleteApiKey(keyToDelete.id)
              }}
            >
              {isDeletePending && <LoaderCircleIcon className="animate-spin" />}
              {t("libraries.api.keys.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}
