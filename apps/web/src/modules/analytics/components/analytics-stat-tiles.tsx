import { cn } from "@workspace/ui/lib/utils"
import { useTranslation } from "react-i18next"

import { formatCount, formatShare, formatWatchTime } from "../analytics.utils"

import type { AnalyticsTotals } from "@/api/generated-api"

/** The period's headline figures in one bordered strip, two by two until there is room for all four in a row. */
export function AnalyticsStatTiles({ totals }: { totals: AnalyticsTotals }) {
  const { t, i18n } = useTranslation()
  const tiles = [
    { key: "views", value: formatCount(totals.views, i18n.language) },
    { key: "watch_time", value: formatWatchTime(totals.watchSeconds) },
    {
      key: "average_view",
      value: formatWatchTime(totals.averageViewSeconds),
    },
    {
      key: "average_completion",
      value: formatShare(totals.averageCompletion, i18n.language),
    },
  ]

  return (
    <div className="@container rounded-lg border">
      <dl className="grid grid-cols-2 @lg:grid-cols-4">
        {tiles.map(({ key, value }, index) => (
          <div
            key={key}
            className={cn(
              "flex flex-col gap-1 border-border px-4 py-3.5",
              index % 2 === 1 && "border-l",
              index >= 2 && "border-t @lg:border-t-0",
              index === 2 && "@lg:border-l"
            )}
          >
            <dt className="truncate text-xs text-muted-foreground">
              {t(`analytics.totals.${key}`)}
            </dt>
            <dd className="text-2xl font-semibold tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
