import { DEFAULT_ANALYTICS_PERIOD_DAYS } from "@workspace/shared"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { AnalyticsPeriodTabs } from "./analytics-period-tabs"
import { AnalyticsStatTiles } from "./analytics-stat-tiles"
import { RetentionChart } from "./retention-chart"

import type { AnalyticsPeriodDays } from "@workspace/shared"
import { useVideoAnalyticsQuery } from "@/api/queries/analytics/useVideoAnalyticsQuery"

type VideoAnalyticsSectionProps = {
  organizationSlug: string
  libraryId: string
  videoId: string
}

/** A video's views and how far viewers got, in its details sheet. */
export function VideoAnalyticsSection({
  organizationSlug,
  libraryId,
  videoId,
}: VideoAnalyticsSectionProps) {
  const { t } = useTranslation()
  const [days, setDays] = useState<AnalyticsPeriodDays>(
    DEFAULT_ANALYTICS_PERIOD_DAYS
  )
  const { data: analytics, isPending } = useVideoAnalyticsQuery(
    organizationSlug,
    libraryId,
    videoId,
    days
  )

  return (
    <section className="flex flex-col gap-3">
      <AnalyticsPeriodTabs days={days} onChange={setDays} />
      {isPending || !analytics ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <>
          <AnalyticsStatTiles totals={analytics.totals} />
          {analytics.totals.views > 0 ? (
            <div className="flex flex-col gap-2">
              <p className="text-xs text-muted-foreground">
                {t("analytics.retention.description")}
              </p>
              <RetentionChart retention={analytics.retention} />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {t("analytics.empty_period")}
            </p>
          )}
        </>
      )}
    </section>
  )
}
