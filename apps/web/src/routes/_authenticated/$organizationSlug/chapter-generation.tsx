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
  ListTreeIcon,
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

import type { ChapterGenerationProvider } from "@/api/generated-api"

import { useChapterGenerationProviderDeleteMutation } from "@/api/mutations/chapter-generation/useChapterGenerationProviderDeleteMutation"
import { useChapterGenerationProviderTestMutation } from "@/api/mutations/chapter-generation/useChapterGenerationProviderTestMutation"
import { useOrganizationQuery } from "@/api/queries/organizations/useOrganizationQuery"
import { useChapterGenerationProvidersQuery } from "@/api/queries/chapter-generation/useChapterGenerationProvidersQuery"
import { TableScrollArea } from "@/components/table-scroll-area"
import { createPageMeta } from "@/lib/page-meta"
import { ChapterGenerationProviderFormDialog } from "@/modules/chapter-generation/components/chapter-generation-provider-form-dialog"

export const Route = createFileRoute(
  "/_authenticated/$organizationSlug/chapter-generation"
)({
  head: () => ({
    meta: createPageMeta({
      title: "Chapter generation",
      description:
        "Connect OpenAI or your own model server to write chapters from captions.",
    }),
  }),
  component: OrganizationChapterGenerationRoute,
})

function OrganizationChapterGenerationRoute() {
  const { t, i18n } = useTranslation()
  const { organizationSlug } = Route.useParams()
  const formatNumber = (value: number) =>
    value.toLocaleString(i18n.language, { maximumFractionDigits: 1 })
  const { data: organizationData } = useOrganizationQuery(organizationSlug)
  const isOwner = organizationData?.membership.role === ORGANIZATION_ROLES.OWNER
  const { data: providers, isPending } = useChapterGenerationProvidersQuery(
    organizationSlug,
    { enabled: isOwner }
  )
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [providerToEdit, setProviderToEdit] =
    useState<ChapterGenerationProvider | null>(null)
  const [providerToDelete, setProviderToDelete] =
    useState<ChapterGenerationProvider | null>(null)
  const { mutate: deleteProvider, isPending: isDeletePending } =
    useChapterGenerationProviderDeleteMutation(organizationSlug, {
      onSuccess: () => setProviderToDelete(null),
    })
  const {
    mutate: testProvider,
    isPending: isTestPending,
    variables: testedProviderId,
  } = useChapterGenerationProviderTestMutation(organizationSlug)

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
                      {t("chapter_generation.owner_only_title")}
                    </AlertTitle>
                    <AlertDescription>
                      {t("chapter_generation.owner_only_description")}
                    </AlertDescription>
                  </Alert>
                </section>
              ))
              .otherwise(() => (
                <>
                  <div className="flex flex-wrap items-start justify-between gap-3 border-b p-4 sm:p-5">
                    <div className="flex items-start gap-3">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <ListTreeIcon className="size-5" />
                      </span>
                      <div>
                        <CardTitle>{t("chapter_generation.title")}</CardTitle>
                        <CardDescription>
                          {t("chapter_generation.description")}
                        </CardDescription>
                      </div>
                    </div>
                    <Button onClick={() => setIsCreateDialogOpen(true)}>
                      <PlusIcon />
                      {t("chapter_generation.create.trigger")}
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
                              <ListTreeIcon />
                            </EmptyMedia>
                            <EmptyTitle>
                              {t("chapter_generation.empty.title")}
                            </EmptyTitle>
                            <EmptyDescription>
                              {t("chapter_generation.empty.description")}
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
                                {t("chapter_generation.columns.name")}
                              </TableHead>
                              <TableHead>
                                {t("chapter_generation.columns.model")}
                              </TableHead>
                              <TableHead>
                                {t("chapter_generation.columns.usage")}
                              </TableHead>
                              <TableHead>
                                {t("chapter_generation.columns.libraries")}
                              </TableHead>
                              <TableHead className="pr-4 text-right sm:pr-5">
                                {t("chapter_generation.columns.actions")}
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
                                        `chapter_generation.kinds.${provider.kind}.short`
                                      )}
                                    </Badge>
                                  </div>
                                  <div className="max-w-64 truncate text-xs text-muted-foreground">
                                    {provider.baseUrl}
                                    {provider.apiKeyHint &&
                                      ` · ${t("chapter_generation.key_hint", { hint: provider.apiKeyHint })}`}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <code className="text-xs">
                                    {provider.model}
                                  </code>
                                </TableCell>
                                <TableCell className="text-xs whitespace-nowrap">
                                  {provider.monthlyTokenLimit === null
                                    ? t(
                                        "chapter_generation.usage.without_limit",
                                        {
                                          used: formatNumber(
                                            provider.tokensUsedThisMonth
                                          ),
                                        }
                                      )
                                    : t("chapter_generation.usage.with_limit", {
                                        used: formatNumber(
                                          provider.tokensUsedThisMonth
                                        ),
                                        limit: formatNumber(
                                          provider.monthlyTokenLimit
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
                                      {t("chapter_generation.connection.test")}
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() =>
                                        setProviderToEdit(provider)
                                      }
                                    >
                                      <PencilIcon />
                                      {t("chapter_generation.edit.trigger")}
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="text-destructive"
                                      disabled={provider.libraryCount > 0}
                                      title={
                                        provider.libraryCount > 0
                                          ? t(
                                              "chapter_generation.delete.in_use"
                                            )
                                          : undefined
                                      }
                                      onClick={() =>
                                        setProviderToDelete(provider)
                                      }
                                    >
                                      <Trash2Icon />
                                      {t("chapter_generation.delete.trigger")}
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

      <ChapterGenerationProviderFormDialog
        organizationSlug={organizationSlug}
        provider={null}
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
      <ChapterGenerationProviderFormDialog
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
              {t("chapter_generation.delete.title")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("chapter_generation.delete.description", {
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
              {t("chapter_generation.delete.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
