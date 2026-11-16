import { Link, createFileRoute, useNavigate } from "@tanstack/react-router"
import { ORGANIZATION_ROLES } from "@workspace/shared"
import { Badge } from "@workspace/ui/components/badge"
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
import { LibraryBigIcon } from "lucide-react"
import { useCallback } from "react"
import { useTranslation } from "react-i18next"
import { P, match } from "ts-pattern"

import { useLibrariesQuery } from "@/api/queries/libraries/useLibrariesQuery"
import { useOrganizationQuery } from "@/api/queries/organizations/useOrganizationQuery"
import { createPageMeta } from "@/lib/page-meta"
import { LibraryCreateDialog } from "@/modules/libraries/components/library-create-dialog"
import { TableScrollArea } from "@/components/table-scroll-area"
import { ListPagination } from "@/modules/pagination/components/list-pagination"
import { ListSearchInput } from "@/modules/pagination/components/list-search-input"
import { useListPageSearch } from "@/modules/pagination/hooks/use-list-page-search"
import { listPageSearchSchema } from "@/modules/pagination/pagination.schemas"

export const Route = createFileRoute(
  "/_authenticated/$organizationSlug/libraries/"
)({
  validateSearch: listPageSearchSchema,
  head: () => ({
    meta: createPageMeta({
      title: "Libraries",
      description: "Organize your organization's videos in libraries.",
    }),
  }),
  component: LibrariesRoute,
})

function LibrariesRoute() {
  const { t, i18n } = useTranslation()
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
  const { data, isPending, isFetching } = useLibrariesQuery(
    organizationSlug,
    params
  )
  const libraries = data?.libraries
  const isOwner = organizationData?.membership.role === ORGANIZATION_ROLES.OWNER

  return (
    <div className="flex min-h-0 flex-1 flex-col px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
      <div className="mx-auto flex min-h-0 w-full max-w-5xl flex-col">
        <Card className="min-h-0 gap-0 overflow-hidden py-0">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <LibraryBigIcon className="size-5" />
              </span>
              <div>
                <CardTitle>{t("libraries.title")}</CardTitle>
                <CardDescription>{t("libraries.description")}</CardDescription>
              </div>
            </div>
            {isOwner && (
              <LibraryCreateDialog organizationSlug={organizationSlug} />
            )}
          </div>
          <div className="border-b px-4 py-3 sm:px-5">
            <ListSearchInput
              value={searchInput}
              onValueChange={setSearchInput}
              placeholder={t("libraries.search_placeholder")}
              isSearching={isSearchPending || (isFetching && !isPending)}
            />
          </div>
          {match({ isPending, libraries, search: params.search })
            .with({ isPending: true }, () => (
              <section className="p-4 sm:p-5">
                <Skeleton className="h-40 w-full" />
              </section>
            ))
            .with(
              {
                libraries: P.when((value) => !value?.length),
                search: P.when(Boolean),
              },
              () => (
                <Empty className="min-h-64 rounded-none border-0 py-14">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <LibraryBigIcon />
                    </EmptyMedia>
                    <EmptyTitle>{t("libraries.no_results.title")}</EmptyTitle>
                    <EmptyDescription>
                      {t("libraries.no_results.description", {
                        search: params.search,
                      })}
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              )
            )
            .with({ libraries: P.when((value) => !value?.length) }, () => (
              <Empty className="min-h-64 rounded-none border-0 py-14">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <LibraryBigIcon />
                  </EmptyMedia>
                  <EmptyTitle>{t("libraries.empty.title")}</EmptyTitle>
                  <EmptyDescription>
                    {isOwner
                      ? t("libraries.empty.owner_description")
                      : t("libraries.empty.member_description")}
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ))
            .otherwise(() => (
              <TableScrollArea>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-4 sm:pl-5">
                        {t("libraries.columns.name")}
                      </TableHead>
                      <TableHead>{t("libraries.columns.videos")}</TableHead>
                      <TableHead>{t("libraries.columns.storage")}</TableHead>
                      <TableHead>{t("libraries.columns.created")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {libraries?.map((library) => (
                      <TableRow key={library.id}>
                        <TableCell className="pl-4 font-medium sm:pl-5">
                          <Link
                            to="/$organizationSlug/libraries/$libraryId"
                            params={{ organizationSlug, libraryId: library.id }}
                            className="hover:underline"
                          >
                            {library.name}
                          </Link>
                        </TableCell>
                        <TableCell>{library.videoCount}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {library.storageName ??
                              t(
                                `libraries.storage_kinds.${library.storageKind}`
                              )}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Intl.DateTimeFormat(i18n.language, {
                            dateStyle: "medium",
                          }).format(new Date(library.createdAt))}
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
        </Card>
      </div>
    </div>
  )
}
