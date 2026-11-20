import { useTranslation } from "react-i18next"

import { formatCount } from "../analytics.utils"
import { AnalyticsCard } from "./analytics-card"

import type { ReactNode } from "react"

type RankingListProps = {
  title: string
  emptyText: string
  rows: { key: string; label: ReactNode; views: number; detail?: string }[]
}

/** Rows ranked by views, each with a bar against the top row. */
export function RankingList({ title, emptyText, rows }: RankingListProps) {
  const { t, i18n } = useTranslation()
  const topViews = Math.max(1, ...rows.map(({ views }) => views))

  return (
    <AnalyticsCard title={title}>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyText}</p>
      ) : (
        <ol className="flex flex-col gap-3">
          {rows.map(({ key, label, views, detail }) => (
            <li key={key} className="flex flex-col gap-1">
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="min-w-0 truncate">{label}</span>
                <span className="shrink-0 font-medium tabular-nums">
                  {t("analytics.views", {
                    count: views,
                    formatted: formatCount(views, i18n.language),
                  })}
                  {detail && (
                    <span className="ml-2 font-normal text-muted-foreground">
                      {detail}
                    </span>
                  )}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-muted" aria-hidden>
                <div
                  className="h-full rounded-full bg-chart-2"
                  style={{ width: `${(views / topViews) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ol>
      )}
    </AnalyticsCard>
  )
}
