import { useTranslation } from "react-i18next"

import {
  formatCount,
  formatDay,
  formatWatchTime,
  niceAxisMax,
} from "../analytics.utils"

import type { AnalyticsDay } from "@/api/generated-api"

/**
 * Views per day as columns from one baseline. Each column shows its day's
 * figures on hover and keyboard focus; a table carries them for screen readers.
 */
export function DailyViewsChart({ daily }: { daily: AnalyticsDay[] }) {
  const { t, i18n } = useTranslation()
  const axisMax = niceAxisMax(Math.max(...daily.map(({ views }) => views)))
  const ticks = [axisMax, axisMax / 2, 0]
  const labelEvery = Math.ceil(daily.length / 7)

  return (
    <figure className="flex flex-col gap-2">
      <div className="flex gap-2" aria-hidden>
        <div className="flex h-48 flex-col justify-between text-right text-xs text-muted-foreground tabular-nums">
          {ticks.map((tick) => (
            <span key={tick} className="-my-2 leading-4">
              {formatCount(tick, i18n.language)}
            </span>
          ))}
        </div>
        <div className="relative h-48 flex-1">
          {ticks.map((tick) => (
            <div
              key={tick}
              className="absolute inset-x-0 border-t border-border"
              style={{ bottom: `${(tick / axisMax) * 100}%` }}
            />
          ))}
          <div className="absolute inset-0 flex items-end gap-0.5">
            {daily.map((day) => (
              <div
                key={day.date}
                tabIndex={0}
                className="group/day relative flex h-full flex-1 items-end justify-center outline-none"
              >
                <div
                  className="w-full max-w-6 rounded-t bg-chart-2 transition-colors group-hover/day:bg-chart-3 group-focus-visible/day:bg-chart-3"
                  style={{ height: `${(day.views / axisMax) * 100}%` }}
                />
                <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 rounded-md border bg-popover px-2 py-1 text-xs whitespace-nowrap text-popover-foreground shadow-md group-hover/day:block group-focus-visible/day:block">
                  <strong className="block tabular-nums">
                    {t("analytics.views", {
                      count: day.views,
                      formatted: formatCount(day.views, i18n.language),
                    })}
                  </strong>
                  <span className="block text-muted-foreground">
                    {formatDay(day.date, i18n.language)} ·{" "}
                    {formatWatchTime(day.watchSeconds)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div
        className="flex gap-0.5 pl-8 text-xs text-muted-foreground"
        aria-hidden
      >
        {daily.map((day, index) => (
          <span key={day.date} className="flex-1 text-center whitespace-nowrap">
            {index % labelEvery === 0 ? formatDay(day.date, i18n.language) : ""}
          </span>
        ))}
      </div>
      <table className="sr-only">
        <caption>{t("analytics.daily.title")}</caption>
        <thead>
          <tr>
            <th>{t("analytics.table.date")}</th>
            <th>{t("analytics.table.views")}</th>
            <th>{t("analytics.table.watch_time")}</th>
          </tr>
        </thead>
        <tbody>
          {daily.map((day) => (
            <tr key={day.date}>
              <td>{formatDay(day.date, i18n.language)}</td>
              <td>{day.views}</td>
              <td>{formatWatchTime(day.watchSeconds)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  )
}
