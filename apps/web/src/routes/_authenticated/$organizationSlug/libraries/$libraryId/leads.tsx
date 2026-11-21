import { createFileRoute, useNavigate } from "@tanstack/react-router"
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
import { Button, buttonVariants } from "@workspace/ui/components/button"
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
import { DownloadIcon, MailIcon, Trash2Icon } from "lucide-react"
import { useCallback, useState } from "react"
import { useTranslation } from "react-i18next"
import { P, match } from "ts-pattern"

import type { VideoCtaLead } from "@/api/generated-api"
import { useLeadDeleteMutation } from "@/api/mutations/libraries/useLeadDeleteMutation"
import { useLibraryLeadsQuery } from "@/api/queries/libraries/useLibraryLeadsQuery"
import { TableScrollArea } from "@/components/table-scroll-area"
import { createPageMeta } from "@/lib/page-meta"
import { buildLeadsExportUrl } from "@/modules/libraries/libraries.utils"
import { ListPagination } from "@/modules/pagination/components/list-pagination"
import { ListSearchInput } from "@/modules/pagination/components/list-search-input"
import { useListPageSearch } from "@/modules/pagination/hooks/use-list-page-search"
import { listPageSearchSchema } from "@/modules/pagination/pagination.schemas"

export const Route = createFileRoute(
  "/_authenticated/$organizationSlug/libraries/$libraryId/leads"
)({
  validateSearch: listPageSearchSchema,
  head: () => ({
    meta: createPageMeta({
      title: "Library leads",
      description:
        "Email addresses viewers left in the library's calls to action.",
    }),
  }),
  component: LibraryLeadsRoute,
})

function LibraryLeadsRoute() {
  const { t, i18n } = useTranslation()
  const { organizationSlug, libraryId } = Route.useParams()
  const search = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })
  const handleSearchChange = useCallback(
    (nextSearch: typeof search) =>
      void navigate({ search: nextSearch, replace: true }),
    [navigate]
  )
  const { params, searchInput, setSearchInput, isSearchPending, setPage } =
    useListPageSearch(search, handleSearchChange)
  const { data, isPending, isFetching } = useLibraryLeadsQuery(
    organizationSlug,
    libraryId,
    params
  )
  const [leadToDelete, setLeadToDelete] = useState<VideoCtaLead | null>(null)
  const { mutate: deleteLead, isPending: isDeletePending } =
    useLeadDeleteMutation(organizationSlug, libraryId, {
      onSuccess: () => setLeadToDelete(null),
    })
  const formatDateTime = (value: string) =>
    new Intl.DateTimeFormat(i18n.language, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value))

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 sm:px-5">
        <p className="max-w-prose text-sm text-muted-foreground">
          {t("leads.description")}
        </p>
        {Boolean(data?.pagination.totalItems) && (
          <a
            href={buildLeadsExportUrl(organizationSlug, libraryId)}
            download
            className={buttonVariants({ variant: "outline" })}
          >
            <DownloadIcon />
            {t("leads.export")}
          </a>
        )}
      </div>
      <div className="border-t px-4 py-3 sm:px-5">
        <ListSearchInput
          value={searchInput}
          onValueChange={setSearchInput}
          placeholder={t("leads.search_placeholder")}
          isSearching={isSearchPending || (isFetching && !isPending)}
        />
      </div>
      {match({ isPending, leads: data?.leads })
        .with({ isPending: true }, () => (
          <section className="px-4 pb-5 sm:px-5">
            <Skeleton className="h-40 w-full" />
          </section>
        ))
        .with({ leads: P.when((value) => !value?.length) }, () => (
          <Empty className="min-h-64 rounded-none border-0 border-t py-14">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <MailIcon />
              </EmptyMedia>
              <EmptyTitle>
                {params.search
                  ? t("leads.no_results.title")
                  : t("leads.empty.title")}
              </EmptyTitle>
              <EmptyDescription>
                {params.search
                  ? t("leads.no_results.description", {
                      search: params.search,
                    })
                  : t("leads.empty.description")}
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
                    {t("leads.columns.email")}
                  </TableHead>
                  <TableHead>{t("leads.columns.video")}</TableHead>
                  <TableHead>{t("leads.columns.site")}</TableHead>
                  <TableHead>{t("leads.columns.consented_at")}</TableHead>
                  <TableHead className="pr-4 text-right sm:pr-5">
                    {t("leads.columns.actions")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.leads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell className="pl-4 font-medium sm:pl-5">
                      {lead.email}
                    </TableCell>
                    <TableCell>
                      <div className="max-w-64 truncate">{lead.videoTitle}</div>
                      <div className="max-w-64 truncate text-xs text-muted-foreground">
                        {lead.ctaHeading}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {lead.embeddingHost ?? "—"}
                    </TableCell>
                    <TableCell
                      className="whitespace-nowrap text-muted-foreground"
                      title={lead.consentText}
                    >
                      {formatDateTime(lead.consentedAt)}
                    </TableCell>
                    <TableCell className="pr-4 sm:pr-5">
                      <div className="flex justify-end">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => setLeadToDelete(lead)}
                        >
                          <Trash2Icon />
                          {t("leads.delete.trigger")}
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

      <AlertDialog
        open={Boolean(leadToDelete)}
        onOpenChange={(open) => {
          if (!open) setLeadToDelete(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("leads.delete.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("leads.delete.description", {
                email: leadToDelete?.email ?? "",
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isDeletePending}
              onClick={() => {
                if (leadToDelete) deleteLead(leadToDelete.id)
              }}
            >
              {t("leads.delete.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
