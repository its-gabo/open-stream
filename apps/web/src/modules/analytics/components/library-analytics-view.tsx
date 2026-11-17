import { Skeleton } from "@workspace/ui/components/skeleton"
import { useTranslation } from "react-i18next"

import { formatWatchTime } from "../analytics.utils"
import { AnalyticsBreakdowns } from "./analytics-breakdowns"
import { AnalyticsPeriodTabs } from "./analytics-period-tabs"
import { AnalyticsStatTiles } from "./analytics-stat-tiles"
import { DailyViewsChart } from "./daily-views-chart"
import { RankingList } from "./ranking-list"

import type { AnalyticsPeriodDays } from "@workspace/shared"
import { useLibraryAnalyticsQuery } from "@/api/queries/analytics/useLibraryAnalyticsQuery"

type LibraryAnalyticsViewProps = {
  organizationSlug: string
  libraryId: string
  days: AnalyticsPeriodDays
  onDaysChange: (days: AnalyticsPeriodDays) => void
}

/** A library's views over the chosen period: headline figures, the daily trend and what drew them. */
export function LibraryAnalyticsView({
  organizationSlug,
  libraryId,
  days,
  onDaysChange,
}: LibraryAnalyticsViewProps) {
  const { t } = useTranslation()
  const { data: analytics, isPending } = useLibraryAnalyticsQuery(
    organizationSlug,
    libraryId,
    days
  )

  return (
    <div className="flex flex-col gap-5 p-4 sm:px-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {t("analytics.description")}
        </p>
        <AnalyticsPeriodTabs days={days} onChange={onDaysChange} />
      </div>
      {isPending || !analytics ? (
        <Skeleton className="h-96 w-full" />
      ) : (
        <>
          <AnalyticsStatTiles totals={analytics.totals} />
          <section className="flex flex-col gap-3 rounded-lg border p-4">
            <h3 className="text-sm font-medium">
              {t("analytics.daily.title")}
            </h3>
            <DailyViewsChart daily={analytics.daily} />
          </section>
          <div className="grid gap-4 lg:grid-cols-3">
            <RankingList
              title={t("analytics.top_videos.title")}
              emptyText={t("analytics.empty_period")}
              rows={analytics.topVideos.map(
                ({ videoId, title, views, watchSeconds }) => ({
                  key: videoId,
                  label: title,
                  views,
                  detail: formatWatchTime(watchSeconds),
                })
              )}
            />
            <AnalyticsBreakdowns
              devices={analytics.devices}
              embeddingHosts={analytics.embeddingHosts}
            />
          </div>
        </>
      )}
    </div>
  )
}
