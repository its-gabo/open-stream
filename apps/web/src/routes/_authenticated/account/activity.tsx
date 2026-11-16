import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { Card, CardDescription, CardTitle } from "@workspace/ui/components/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@workspace/ui/components/empty"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { ShieldCheckIcon } from "lucide-react"
import { useCallback } from "react"
import { useTranslation } from "react-i18next"
import { P, match } from "ts-pattern"

import { useAccountActivityQuery } from "@/api/queries/activity/useAccountActivityQuery"
import { useOrganizationContextQuery } from "@/api/queries/organizations/useOrganizationContextQuery"
import { createPageMeta } from "@/lib/page-meta"
import { ActivityTable } from "@/modules/activity/components/activity-table"
import { OrganizationGatewayShell } from "@/modules/organizations/components/organization-gateway-shell"
import { TableScrollArea } from "@/components/table-scroll-area"
import { ListPagination } from "@/modules/pagination/components/list-pagination"
import { ListSearchInput } from "@/modules/pagination/components/list-search-input"
import { useListPageSearch } from "@/modules/pagination/hooks/use-list-page-search"
import { listPageSearchSchema } from "@/modules/pagination/pagination.schemas"

export const Route = createFileRoute("/_authenticated/account/activity")({
  validateSearch: listPageSearchSchema,
  head: () => ({
    meta: createPageMeta({
      title: "Account activity",
      description: "Your sign-ins, failed sign-ins and password changes.",
    }),
  }),
  component: AccountActivityRoute,
})

function AccountActivityRoute() {
  const { t } = useTranslation()
  const search = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })
  const handleSearchChange = useCallback(
    (nextSearch: typeof search) =>
      void navigate({ search: nextSearch, replace: true }),
    [navigate]
  )
  const { params, searchInput, setSearchInput, isSearchPending, setPage } =
    useListPageSearch(search, handleSearchChange)
  const { data: context } = useOrganizationContextQuery()
  const { data, isPending, isFetching } = useAccountActivityQuery(params)

  return (
    <OrganizationGatewayShell
      activePage="account-activity"
      title={t("account_activity.title")}
      hasMemberships={Boolean(context?.memberships.length)}
    >
      <Card className="min-h-0 gap-0 overflow-hidden py-0">
        <div className="flex items-start gap-3 border-b p-4 sm:p-5">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <ShieldCheckIcon className="size-5" />
          </span>
          <div>
            <CardTitle>{t("account_activity.title")}</CardTitle>
            <CardDescription>
              {t("account_activity.description")}
            </CardDescription>
          </div>
        </div>
        <div className="border-b px-4 py-3 sm:px-5">
          <ListSearchInput
            value={searchInput}
            onValueChange={setSearchInput}
            placeholder={t("account_activity.search_placeholder")}
            isSearching={isSearchPending || (isFetching && !isPending)}
          />
        </div>
        {match({ isPending, activities: data?.activities })
          .with({ isPending: true }, () => (
            <section className="p-4 sm:p-5">
              <Skeleton className="h-40 w-full" />
            </section>
          ))
          .with({ activities: P.when((value) => !value?.length) }, () => (
            <Empty className="min-h-64 rounded-none border-0 py-14">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <ShieldCheckIcon />
                </EmptyMedia>
                <EmptyTitle>{t("activity.no_results.title")}</EmptyTitle>
                <EmptyDescription>
                  {t("activity.no_results.description")}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ))
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
      </Card>
    </OrganizationGatewayShell>
  )
}
