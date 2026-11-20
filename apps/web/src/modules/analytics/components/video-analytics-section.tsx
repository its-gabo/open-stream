import { DEFAULT_ANALYTICS_PERIOD_DAYS } from "@workspace/shared"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { AnalyticsCard } from "./analytics-card"
import { AnalyticsPeriodTabs } from "./analytics-period-tabs"
import { AnalyticsStatTiles } from "./analytics-stat-tiles"
import { ChapterBreakdown } from "./chapter-breakdown"
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
    <section className="flex flex-col gap-4">
      <AnalyticsPeriodTabs days={days} onChange={setDays} />
      {isPending || !analytics ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <>
          <AnalyticsStatTiles totals={analytics.totals} />
          {analytics.totals.views > 0 ? (
            <>
              <AnalyticsCard
                title={t("analytics.retention.title")}
                description={t("analytics.retention.description")}
              >
                <RetentionChart
                  retention={analytics.retention}
                  chapters={analytics.chapters}
                />
              </AnalyticsCard>
              {analytics.chapters.length > 0 && (
                <ChapterBreakdown
                  chapters={analytics.chapters}
                  startedViews={analytics.retention[0]?.views ?? 0}
                />
              )}
            </>
          ) : (
            <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              {t("analytics.empty_period")}
            </p>
          )}
        </>
      )}
    </section>
  )
}
