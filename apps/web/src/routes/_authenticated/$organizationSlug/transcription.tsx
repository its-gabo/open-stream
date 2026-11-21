import { createFileRoute } from "@tanstack/react-router"
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
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Card, CardDescription, CardTitle } from "@workspace/ui/components/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@workspace/ui/components/empty"
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
  AudioLinesIcon,
  LoaderCircleIcon,
  LockIcon,
  PencilIcon,
  PlugZapIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { P, match } from "ts-pattern"

import type { TranscriptionProvider } from "@/api/generated-api"

import { useTranscriptionProviderDeleteMutation } from "@/api/mutations/transcription/useTranscriptionProviderDeleteMutation"
import { useTranscriptionProviderTestMutation } from "@/api/mutations/transcription/useTranscriptionProviderTestMutation"
import { useOrganizationQuery } from "@/api/queries/organizations/useOrganizationQuery"
import { useTranscriptionProvidersQuery } from "@/api/queries/transcription/useTranscriptionProvidersQuery"
import { TableScrollArea } from "@/components/table-scroll-area"
import { createPageMeta } from "@/lib/page-meta"
import { TranscriptionProviderFormDialog } from "@/modules/transcription/components/transcription-provider-form-dialog"

export const Route = createFileRoute(
  "/_authenticated/$organizationSlug/transcription"
)({
  head: () => ({
    meta: createPageMeta({
      title: "Transcription",
      description:
        "Connect OpenAI or your own speech-to-text server to turn videos into captions.",
    }),
  }),
  component: OrganizationTranscriptionRoute,
})

function OrganizationTranscriptionRoute() {
  const { t, i18n } = useTranslation()
  const { organizationSlug } = Route.useParams()
  const formatNumber = (value: number) =>
    value.toLocaleString(i18n.language, { maximumFractionDigits: 1 })
  const { data: organizationData } = useOrganizationQuery(organizationSlug)
  const isOwner = organizationData?.membership.role === ORGANIZATION_ROLES.OWNER
  const { data: providers, isPending } = useTranscriptionProvidersQuery(
    organizationSlug,
    { enabled: isOwner }
  )
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [providerToEdit, setProviderToEdit] =
    useState<TranscriptionProvider | null>(null)
  const [providerToDelete, setProviderToDelete] =
    useState<TranscriptionProvider | null>(null)
  const { mutate: deleteProvider, isPending: isDeletePending } =
    useTranscriptionProviderDeleteMutation(organizationSlug, {
      onSuccess: () => setProviderToDelete(null),
    })
  const {
    mutate: testProvider,
    isPending: isTestPending,
    variables: testedProviderId,
  } = useTranscriptionProviderTestMutation(organizationSlug)

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1 flex-col px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
        <div className="mx-auto flex min-h-0 w-full max-w-5xl flex-col">
          <Card className="min-h-0 gap-0 overflow-hidden py-0">
            {match(isOwner)
              .with(false, () => (
                <section className="p-4 sm:p-5">
                  <Alert>
                    <LockIcon />
                    <AlertTitle>
                      {t("transcription.owner_only_title")}
                    </AlertTitle>
                    <AlertDescription>
                      {t("transcription.owner_only_description")}
                    </AlertDescription>
                  </Alert>
                </section>
              ))
              .otherwise(() => (
                <>
                  <div className="flex flex-wrap items-start justify-between gap-3 border-b p-4 sm:p-5">
                    <div className="flex items-start gap-3">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <AudioLinesIcon className="size-5" />
                      </span>
                      <div>
                        <CardTitle>{t("transcription.title")}</CardTitle>
                        <CardDescription>
                          {t("transcription.description")}
                        </CardDescription>
                      </div>
                    </div>
                    <Button onClick={() => setIsCreateDialogOpen(true)}>
                      <PlusIcon />
                      {t("transcription.create.trigger")}
                    </Button>
                  </div>
                  {match({ isPending, providers })
                    .with({ isPending: true }, () => (
                      <section className="p-4 sm:p-5">
                        <Skeleton className="h-40 w-full" />
                      </section>
                    ))
                    .with(
                      { providers: P.when((value) => !value?.length) },
                      () => (
                        <Empty className="min-h-64 rounded-none border-0 py-14">
                          <EmptyHeader>
                            <EmptyMedia variant="icon">
                              <AudioLinesIcon />
                            </EmptyMedia>
                            <EmptyTitle>
                              {t("transcription.empty.title")}
                            </EmptyTitle>
                            <EmptyDescription>
                              {t("transcription.empty.description")}
                            </EmptyDescription>
                          </EmptyHeader>
                        </Empty>
                      )
                    )
                    .otherwise(() => (
                      <TableScrollArea>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="pl-4 sm:pl-5">
                                {t("transcription.columns.name")}
                              </TableHead>
                              <TableHead>
                                {t("transcription.columns.model")}
                              </TableHead>
                              <TableHead>
                                {t("transcription.columns.usage")}
                              </TableHead>
                              <TableHead>
                                {t("transcription.columns.libraries")}
                              </TableHead>
                              <TableHead className="pr-4 text-right sm:pr-5">
                                {t("transcription.columns.actions")}
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {providers?.map((provider) => (
                              <TableRow key={provider.id}>
                                <TableCell className="pl-4 sm:pl-5">
                                  <div className="flex items-center gap-2 font-medium">
                                    {provider.name}
                                    <Badge variant="outline">
                                      {t(
                                        `transcription.kinds.${provider.kind}.short`
                                      )}
                                    </Badge>
                                  </div>
                                  <div className="max-w-64 truncate text-xs text-muted-foreground">
                                    {provider.baseUrl}
                                    {provider.apiKeyHint &&
                                      ` · ${t("transcription.key_hint", { hint: provider.apiKeyHint })}`}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <code className="text-xs">
                                    {provider.model}
                                  </code>
                                </TableCell>
                                <TableCell className="text-xs whitespace-nowrap">
                                  {provider.monthlyMinuteLimit === null
                                    ? t("transcription.usage.without_limit", {
                                        used: formatNumber(
                                          provider.usedMinutesThisMonth
                                        ),
                                      })
                                    : t("transcription.usage.with_limit", {
                                        used: formatNumber(
                                          provider.usedMinutesThisMonth
                                        ),
                                        limit: formatNumber(
                                          provider.monthlyMinuteLimit
                                        ),
                                      })}
                                </TableCell>
                                <TableCell>
                                  <Badge variant="secondary">
                                    {provider.libraryCount}
                                  </Badge>
                                </TableCell>
                                <TableCell className="pr-4 sm:pr-5">
                                  <div className="flex justify-end gap-1">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      disabled={isTestPending}
                                      onClick={() => testProvider(provider.id)}
                                    >
                                      {isTestPending &&
                                      testedProviderId === provider.id ? (
                                        <LoaderCircleIcon className="animate-spin" />
                                      ) : (
                                        <PlugZapIcon />
                                      )}
                                      {t("transcription.connection.test")}
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() =>
                                        setProviderToEdit(provider)
                                      }
                                    >
                                      <PencilIcon />
                                      {t("transcription.edit.trigger")}
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="text-destructive"
                                      disabled={provider.libraryCount > 0}
                                      title={
                                        provider.libraryCount > 0
                                          ? t("transcription.delete.in_use")
                                          : undefined
                                      }
                                      onClick={() =>
                                        setProviderToDelete(provider)
                                      }
                                    >
                                      <Trash2Icon />
                                      {t("transcription.delete.trigger")}
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableScrollArea>
                    ))}
                </>
              ))}
          </Card>
        </div>
      </div>

      <TranscriptionProviderFormDialog
        organizationSlug={organizationSlug}
        provider={null}
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
      <TranscriptionProviderFormDialog
        organizationSlug={organizationSlug}
        provider={providerToEdit}
        open={Boolean(providerToEdit)}
        onOpenChange={(open) => {
          if (!open) setProviderToEdit(null)
        }}
      />

      <AlertDialog
        open={Boolean(providerToDelete)}
        onOpenChange={(open) => {
          if (!open) setProviderToDelete(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("transcription.delete.title")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("transcription.delete.description", {
                name: providerToDelete?.name,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isDeletePending}
              onClick={() => {
                if (providerToDelete) deleteProvider(providerToDelete.id)
              }}
            >
              {isDeletePending && <LoaderCircleIcon className="animate-spin" />}
              {t("transcription.delete.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
