import { createFileRoute, useNavigate } from "@tanstack/react-router"
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
  DatabaseIcon,
  LoaderCircleIcon,
  LockIcon,
  PencilIcon,
  PlugZapIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react"
import { useCallback, useState } from "react"
import { useTranslation } from "react-i18next"
import { P, match } from "ts-pattern"

import type { Storage } from "@/api/generated-api"

import { useSavedStorageConnectionTestMutation } from "@/api/mutations/storages/useSavedStorageConnectionTestMutation"
import { useStorageDeleteMutation } from "@/api/mutations/storages/useStorageDeleteMutation"
import { useOrganizationQuery } from "@/api/queries/organizations/useOrganizationQuery"
import { useStoragesQuery } from "@/api/queries/storages/useStoragesQuery"
import { createPageMeta } from "@/lib/page-meta"
import { TableScrollArea } from "@/components/table-scroll-area"
import { ListPagination } from "@/modules/pagination/components/list-pagination"
import { ListSearchInput } from "@/modules/pagination/components/list-search-input"
import { useListPageSearch } from "@/modules/pagination/hooks/use-list-page-search"
import { listPageSearchSchema } from "@/modules/pagination/pagination.schemas"
import { StorageFormDialog } from "@/modules/storages/components/storage-form-dialog"

export const Route = createFileRoute(
  "/_authenticated/$organizationSlug/storages"
)({
  validateSearch: listPageSearchSchema,
  head: () => ({
    meta: createPageMeta({
      title: "Storages",
      description:
        "Connect S3-compatible buckets once and reuse them across libraries.",
    }),
  }),
  component: OrganizationStoragesRoute,
})

function OrganizationStoragesRoute() {
  const { t } = useTranslation()
  const { organizationSlug } = Route.useParams()
  const search = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })
  const handleSearchChange = useCallback(
    (nextSearch: typeof search) =>
      void navigate({ search: nextSearch, replace: true }),
    [navigate]
  )
  const { params, searchInput, setSearchInput, isSearchPending, setPage } =
    useListPageSearch(search, handleSearchChange)
  const { data: organizationData } = useOrganizationQuery(organizationSlug)
  const isOwner = organizationData?.membership.role === ORGANIZATION_ROLES.OWNER
  const { data, isPending, isFetching } = useStoragesQuery(
    organizationSlug,
    params,
    { enabled: isOwner }
  )
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [storageToEdit, setStorageToEdit] = useState<Storage | null>(null)
  const [storageToDelete, setStorageToDelete] = useState<Storage | null>(null)

  const { mutate: deleteStorage, isPending: isDeletePending } =
    useStorageDeleteMutation(organizationSlug, {
      onSuccess: () => setStorageToDelete(null),
    })
  const {
    mutate: testSavedConnection,
    isPending: isTestPending,
    variables: testedStorageId,
  } = useSavedStorageConnectionTestMutation(organizationSlug)

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
                    <AlertTitle>{t("storages.owner_only_title")}</AlertTitle>
                    <AlertDescription>
                      {t("storages.owner_only_description")}
                    </AlertDescription>
                  </Alert>
                </section>
              ))
              .otherwise(() => (
                <>
                  <div className="flex flex-wrap items-start justify-between gap-3 border-b p-4 sm:p-5">
                    <div className="flex items-start gap-3">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <DatabaseIcon className="size-5" />
                      </span>
                      <div>
                        <CardTitle>{t("storages.title")}</CardTitle>
                        <CardDescription>
                          {t("storages.description")}
                        </CardDescription>
                      </div>
                    </div>
                    <Button onClick={() => setIsCreateDialogOpen(true)}>
                      <PlusIcon />
                      {t("storages.create.trigger")}
                    </Button>
                  </div>
                  <div className="border-b px-4 py-3 sm:px-5">
                    <ListSearchInput
                      value={searchInput}
                      onValueChange={setSearchInput}
                      placeholder={t("storages.search_placeholder")}
                      isSearching={
                        isSearchPending || (isFetching && !isPending)
                      }
                    />
                  </div>
                  {match({ isPending, storages: data?.storages })
                    .with({ isPending: true }, () => (
                      <section className="p-4 sm:p-5">
                        <Skeleton className="h-40 w-full" />
                      </section>
                    ))
                    .with(
                      { storages: P.when((value) => !value?.length) },
                      () => (
                        <Empty className="min-h-64 rounded-none border-0 py-14">
                          <EmptyHeader>
                            <EmptyMedia variant="icon">
                              <DatabaseIcon />
                            </EmptyMedia>
                            <EmptyTitle>
                              {params.search
                                ? t("storages.no_results.title")
                                : t("storages.empty.title")}
                            </EmptyTitle>
                            <EmptyDescription>
                              {params.search
                                ? t("storages.no_results.description", {
                                    search: params.search,
                                  })
                                : t("storages.empty.description")}
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
                                {t("storages.columns.name")}
                              </TableHead>
                              <TableHead>
                                {t("storages.columns.bucket")}
                              </TableHead>
                              <TableHead>
                                {t("storages.columns.libraries")}
                              </TableHead>
                              <TableHead className="pr-4 text-right sm:pr-5">
                                {t("storages.columns.actions")}
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {data?.storages.map((storage) => (
                              <TableRow key={storage.id}>
                                <TableCell className="pl-4 sm:pl-5">
                                  <div className="flex items-center gap-2 font-medium">
                                    {storage.name}
                                    {storage.isLocked && (
                                      <LockIcon
                                        className="size-3.5 text-muted-foreground"
                                        aria-label={t("storages.locked_title")}
                                      />
                                    )}
                                  </div>
                                  <div className="max-w-64 truncate text-xs text-muted-foreground">
                                    {storage.endpoint}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <code className="text-xs">
                                    {storage.bucket}
                                  </code>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="secondary">
                                    {storage.libraryCount}
                                  </Badge>
                                </TableCell>
                                <TableCell className="pr-4 sm:pr-5">
                                  <div className="flex justify-end gap-1">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      disabled={isTestPending}
                                      onClick={() =>
                                        testSavedConnection(storage.id)
                                      }
                                    >
                                      {isTestPending &&
                                      testedStorageId === storage.id ? (
                                        <LoaderCircleIcon className="animate-spin" />
                                      ) : (
                                        <PlugZapIcon />
                                      )}
                                      {t("storages.connection.test")}
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => setStorageToEdit(storage)}
                                    >
                                      <PencilIcon />
                                      {t("storages.edit.trigger")}
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="text-destructive"
                                      disabled={storage.libraryCount > 0}
                                      title={
                                        storage.libraryCount > 0
                                          ? t("storages.delete.in_use")
                                          : undefined
                                      }
                                      onClick={() =>
                                        setStorageToDelete(storage)
                                      }
                                    >
                                      <Trash2Icon />
                                      {t("storages.delete.trigger")}
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableScrollArea>
                    ))}
                  {data && (
                    <ListPagination
                      pagination={data.pagination}
                      onPageChange={setPage}
                      isFetching={isFetching}
                    />
                  )}
                </>
              ))}
          </Card>
        </div>
      </div>

      <StorageFormDialog
        organizationSlug={organizationSlug}
        storage={null}
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
      <StorageFormDialog
        organizationSlug={organizationSlug}
        storage={storageToEdit}
        open={Boolean(storageToEdit)}
        onOpenChange={(open) => {
          if (!open) setStorageToEdit(null)
        }}
      />

      <AlertDialog
        open={Boolean(storageToDelete)}
        onOpenChange={(open) => {
          if (!open) setStorageToDelete(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("storages.delete.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("storages.delete.description", {
                name: storageToDelete?.name,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isDeletePending}
              onClick={() => {
                if (storageToDelete) deleteStorage(storageToDelete.id)
              }}
            >
              {isDeletePending && <LoaderCircleIcon className="animate-spin" />}
              {t("storages.delete.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
