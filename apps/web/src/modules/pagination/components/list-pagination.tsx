import { Button } from "@workspace/ui/components/button"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import { useTranslation } from "react-i18next"

import type { Pagination } from "@/api/generated-api"

type ListPaginationProps = {
  pagination: Pagination
  onPageChange: (page: number) => void
  isFetching?: boolean
}

/** Previous and next page controls with the range of items shown; hidden while everything fits on one page. */
export function ListPagination({
  pagination,
  onPageChange,
  isFetching = false,
}: ListPaginationProps) {
  const { t } = useTranslation()
  const { page, pageSize, totalItems, totalPages } = pagination

  if (totalPages <= 1) return null

  return (
    <nav
      aria-label={t("pagination.label")}
      className="flex items-center justify-between gap-3 border-t px-4 py-3 text-sm sm:px-5"
    >
      <span className="text-muted-foreground">
        {t("pagination.range", {
          from: (page - 1) * pageSize + 1,
          to: Math.min(page * pageSize, totalItems),
          total: totalItems,
        })}
      </span>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1 || isFetching}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeftIcon />
          {t("pagination.previous")}
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages || isFetching}
          onClick={() => onPageChange(page + 1)}
        >
          {t("pagination.next")}
          <ChevronRightIcon />
        </Button>
      </div>
    </nav>
  )
}
