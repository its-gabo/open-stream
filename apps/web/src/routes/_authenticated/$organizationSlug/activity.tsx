import { createFileRoute, useNavigate } from "@tanstack/react-router"
import {
  ORGANIZATION_ROLES,
  type ActivityResourceType,
} from "@workspace/shared"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert"
import { Card, CardDescription, CardTitle } from "@workspace/ui/components/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@workspace/ui/components/empty"
import { SearchableSelect } from "@workspace/ui/components/searchable-select"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { HistoryIcon, LockIcon } from "lucide-react"
import { useCallback } from "react"
import { useTranslation } from "react-i18next"
import { P, match } from "ts-pattern"

import { useOrganizationActivityQuery } from "@/api/queries/activity/useOrganizationActivityQuery"
import { useOrganizationQuery } from "@/api/queries/organizations/useOrganizationQuery"
import { createPageMeta } from "@/lib/page-meta"
import {
  ACTIVITY_RESOURCE_TYPE_OPTIONS,
  ALL_RESOURCE_TYPES,
} from "@/modules/activity/activity.constants"
import { activitySearchSchema } from "@/modules/activity/activity.schemas"
import { ActivityTable } from "@/modules/activity/components/activity-table"
import { TableScrollArea } from "@/components/table-scroll-area"
import { ListPagination } from "@/modules/pagination/components/list-pagination"
import { ListSearchInput } from "@/modules/pagination/components/list-search-input"
import { useListPageSearch } from "@/modules/pagination/hooks/use-list-page-search"

export const Route = createFileRoute(
  "/_authenticated/$organizationSlug/activity"
)({
  validateSearch: activitySearchSchema,
  head: () => ({
    meta: createPageMeta({
      title: "Activity",
      description: "See who changed what in the organization, and when.",
    }),
  }),
  component: OrganizationActivityRoute,
})

function OrganizationActivityRoute() {
  const { t } = useTranslation()
  const { organizationSlug } = Route.useParams()
  const search = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })
  const handleSearchChange = useCallback(
    (nextSearch: Omit<typeof search, "resourceType">) =>
      void navigate({
        search: (current) => ({ ...current, ...nextSearch }),
        replace: true,
      }),
    [navigate]
  )
  const { params, searchInput, setSearchInput, isSearchPending, setPage } =
    useListPageSearch(search, handleSearchChange)
  const { data: organizationData } = useOrganizationQuery(organizationSlug)
  const isOwner = organizationData?.membership.role === ORGANIZATION_ROLES.OWNER
  const { data, isPending, isFetching } = useOrganizationActivityQuery(
    organizationSlug,
    { ...params, resourceType: search.resourceType },
    { enabled: isOwner }
  )
  const isFiltered = Boolean(params.search || search.resourceType)

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
                    <AlertTitle>{t("activity.owner_only_title")}</AlertTitle>
                    <AlertDescription>
                      {t("activity.owner_only_description")}
                    </AlertDescription>
                  </Alert>
                </section>
              ))
              .otherwise(() => (
                <>
                  <div className="flex items-start gap-3 border-b p-4 sm:p-5">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <HistoryIcon className="size-5" />
                    </span>
                    <div>
                      <CardTitle>{t("activity.title")}</CardTitle>
                      <CardDescription>
                        {t("activity.description")}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 border-b px-4 py-3 sm:flex-row sm:px-5">
                    <div className="flex-1">
                      <ListSearchInput
                        value={searchInput}
                        onValueChange={setSearchInput}
                        placeholder={t("activity.search_placeholder")}
                        isSearching={
                          isSearchPending || (isFetching && !isPending)
                        }
                      />
                    </div>
                    <div className="sm:w-56">
                      <SearchableSelect
                        value={search.resourceType ?? ALL_RESOURCE_TYPES}
                        onValueChange={(value) =>
                          void navigate({
                            search: (current) => ({
                              ...current,
                              page: undefined,
                              resourceType:
                                value === ALL_RESOURCE_TYPES
                                  ? undefined
                                  : (value as ActivityResourceType),
                            }),
                            replace: true,
                          })
                        }
                        options={[
                          {
                            value: ALL_RESOURCE_TYPES,
                            label: t("activity.resource_types.all"),
                          },
                          ...ACTIVITY_RESOURCE_TYPE_OPTIONS.map((type) => ({
                            value: type,
                            label: t(`activity.resource_types.${type}`),
                          })),
                        ]}
                        searchPlaceholder={t("activity.resource_type_search")}
                      />
                    </div>
                  </div>
                  {match({ isPending, activities: data?.activities })
                    .with({ isPending: true }, () => (
                      <section className="p-4 sm:p-5">
                        <Skeleton className="h-40 w-full" />
                      </section>
                    ))
                    .with(
                      { activities: P.when((value) => !value?.length) },
                      () => (
                        <Empty className="min-h-64 rounded-none border-0 py-14">
                          <EmptyHeader>
                            <EmptyMedia variant="icon">
                              <HistoryIcon />
                            </EmptyMedia>
                            <EmptyTitle>
                              {isFiltered
                                ? t("activity.no_results.title")
                                : t("activity.empty.title")}
                            </EmptyTitle>
                            <EmptyDescription>
                              {isFiltered
                                ? t("activity.no_results.description")
                                : t("activity.empty.description")}
                            </EmptyDescription>
                          </EmptyHeader>
                        </Empty>
                      )
                    )
                    .otherwise(() => (
                      <TableScrollArea>
                        <ActivityTable activities={data?.activities ?? []} />
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
    </div>
  )
}
