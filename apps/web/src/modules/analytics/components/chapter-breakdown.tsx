import { cn } from "@workspace/ui/lib/utils"
import { useTranslation } from "react-i18next"

import { formatShare } from "../analytics.utils"
import { AnalyticsCard } from "./analytics-card"

import type { ChapterAnalytics } from "@/api/generated-api"
import { formatPlaybackTime } from "@/modules/libraries/libraries.utils"

type ChapterBreakdownProps = {
  chapters: ChapterAnalytics[]
  /** Views that started the video, which each chapter's shares are of. */
  startedViews: number
}

/**
 * How far views got through each chapter: the light bar is the share that
 * reached its start, the dark one the share that played on to its end.
 */
export function ChapterBreakdown({
  chapters,
  startedViews,
}: ChapterBreakdownProps) {
  const { t, i18n } = useTranslation()
  const shareOf = (views: number) =>
    startedViews > 0 ? views / startedViews : 0
  const series = [
    { key: "reached", swatch: "bg-chart-2/35" },
    { key: "finished", swatch: "bg-chart-2" },
  ] as const

  return (
    <AnalyticsCard
      title={t("analytics.chapters.title")}
      aside={
        <ul className="flex items-center gap-3 text-xs text-muted-foreground">
          {series.map(({ key, swatch }) => (
            <li key={key} className="flex items-center gap-1.5">
              <span className={cn("size-2 rounded-full", swatch)} aria-hidden />
              {t(`analytics.chapters.${key}`)}
            </li>
          ))}
        </ul>
      }
    >
      <ol className="flex flex-col gap-3">
        {chapters.map(
          ({ title, startSeconds, endSeconds, views, completedViews }) => (
            <li key={startSeconds} className="flex flex-col gap-1.5">
              <div className="flex items-baseline gap-3 text-sm">
                <span className="min-w-0 flex-1 truncate">
                  <span className="font-medium">{title}</span>
                  <span className="ml-2 text-xs text-muted-foreground tabular-nums">
                    {formatPlaybackTime(startSeconds)}–
                    {formatPlaybackTime(endSeconds)}
                  </span>
                </span>
                <span className="w-10 shrink-0 text-right text-muted-foreground tabular-nums">
                  <span className="sr-only">
                    {t("analytics.chapters.reached")}{" "}
                  </span>
                  {formatShare(shareOf(views), i18n.language)}
                </span>
                <span className="w-10 shrink-0 text-right font-medium tabular-nums">
                  <span className="sr-only">
                    {t("analytics.chapters.finished")}{" "}
                  </span>
                  {formatShare(shareOf(completedViews), i18n.language)}
                </span>
              </div>
              <div className="relative h-1.5 rounded-full bg-muted" aria-hidden>
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-chart-2/35"
                  style={{ width: `${shareOf(views) * 100}%` }}
                />
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-chart-2"
                  style={{ width: `${shareOf(completedViews) * 100}%` }}
                />
              </div>
            </li>
          )
        )}
      </ol>
    </AnalyticsCard>
  )
}
