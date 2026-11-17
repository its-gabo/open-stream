import { useTranslation } from "react-i18next"

import { formatCount, formatShare, formatWatchTime } from "../analytics.utils"

import type { AnalyticsTotals } from "@/api/generated-api"

/** The period's headline figures. */
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
    <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {tiles.map(({ key, value }) => (
        <div
          key={key}
          className="flex flex-col justify-between gap-1 rounded-lg border p-4"
        >
          <dt className="text-sm text-muted-foreground">
            {t(`analytics.totals.${key}`)}
          </dt>
          <dd className="text-2xl font-semibold tabular-nums">{value}</dd>
        </div>
      ))}
    </dl>
  )
}
