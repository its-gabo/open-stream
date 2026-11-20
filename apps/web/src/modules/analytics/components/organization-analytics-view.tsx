import { Link } from "@tanstack/react-router"
import { Card, CardDescription, CardTitle } from "@workspace/ui/components/card"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { ChartColumnIcon } from "lucide-react"
import { useTranslation } from "react-i18next"

import { formatWatchTime } from "../analytics.utils"
import { AnalyticsBreakdowns } from "./analytics-breakdowns"
import { AnalyticsCard } from "./analytics-card"
import { AnalyticsPeriodTabs } from "./analytics-period-tabs"
import { AnalyticsStatTiles } from "./analytics-stat-tiles"
import { DailyViewsChart } from "./daily-views-chart"
import { RankingList } from "./ranking-list"

import type { AnalyticsPeriodDays } from "@workspace/shared"
import { useOrganizationAnalyticsQuery } from "@/api/queries/analytics/useOrganizationAnalyticsQuery"

type OrganizationAnalyticsViewProps = {
  organizationSlug: string
  days: AnalyticsPeriodDays
  onDaysChange: (days: AnalyticsPeriodDays) => void
}

/**
 * The dashboard: every library's views together over the chosen period,
 * with the libraries and videos that drew them; each leads to its own
 * library for the details.
 */
export function OrganizationAnalyticsView({
  organizationSlug,
  days,
  onDaysChange,
}: OrganizationAnalyticsViewProps) {
  const { t } = useTranslation()
  const { data: analytics, isPending } = useOrganizationAnalyticsQuery(
    organizationSlug,
    days
  )
  const rankingLinkClassName = "hover:underline"

  return (
    <Card className="gap-0 py-0">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <ChartColumnIcon className="size-5" />
          </span>
          <div>
            <CardTitle>{t("analytics.dashboard.title")}</CardTitle>
            <CardDescription>
              {t("analytics.dashboard.description")}
            </CardDescription>
          </div>
        </div>
        <AnalyticsPeriodTabs days={days} onChange={onDaysChange} />
      </div>
      <div className="flex flex-col gap-5 p-4 sm:p-5">
        {isPending || !analytics ? (
          <Skeleton className="h-96 w-full" />
        ) : (
          <>
            <AnalyticsStatTiles totals={analytics.totals} />
            <AnalyticsCard title={t("analytics.daily.title")}>
              <DailyViewsChart daily={analytics.daily} />
            </AnalyticsCard>
            <div className="grid gap-4 lg:grid-cols-2">
              <RankingList
                title={t("analytics.top_libraries.title")}
                emptyText={t("analytics.empty_period")}
                rows={analytics.topLibraries.map(
                  ({ libraryId, name, views, watchSeconds }) => ({
                    key: libraryId,
                    label: (
                      <Link
                        to="/$organizationSlug/libraries/$libraryId/analytics"
                        params={{ organizationSlug, libraryId }}
                        search={{ days }}
                        className={rankingLinkClassName}
                      >
                        {name}
                      </Link>
                    ),
                    views,
                    detail: formatWatchTime(watchSeconds),
                  })
                )}
              />
              <RankingList
                title={t("analytics.top_videos.title")}
                emptyText={t("analytics.empty_period")}
                rows={analytics.topVideos.map(
                  ({ videoId, title, libraryId, libraryName, views }) => ({
                    key: videoId,
                    label: (
                      <Link
                        to="/$organizationSlug/libraries/$libraryId"
                        params={{ organizationSlug, libraryId }}
                        search={{ video: videoId }}
                        className={rankingLinkClassName}
                      >
                        {title}
                        <span className="ml-2 text-muted-foreground">
                          {libraryName}
                        </span>
                      </Link>
                    ),
                    views,
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
    </Card>
  )
}
