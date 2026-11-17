import { useTranslation } from "react-i18next"

import { formatShare } from "../analytics.utils"

import type { RetentionPoint } from "@/api/generated-api"

/**
 * The share of views still watching at each tenth of the video, as a line
 * over a light wash. Each tenth shows its figures on hover and keyboard
 * focus; a table carries them for screen readers.
 */
export function RetentionChart({ retention }: { retention: RetentionPoint[] }) {
  const { t, i18n } = useTranslation()
  const started = retention[0]?.views ?? 0
  const points = retention.map(({ percent, views }) => ({
    percent,
    views,
    share: started > 0 ? views / started : 0,
  }))
  const line = points
    .map(({ percent, share }) => `${percent},${100 - share * 100}`)
    .join(" ")

  return (
    <figure className="flex flex-col gap-2 pt-4">
      <div className="flex gap-2" aria-hidden>
        <div className="flex h-36 flex-col justify-between text-right text-xs text-muted-foreground tabular-nums">
          {[1, 0.5, 0].map((share) => (
            <span key={share} className="-my-2 leading-4">
              {formatShare(share, i18n.language)}
            </span>
          ))}
        </div>
        <div className="relative h-36 flex-1">
          {[1, 0.5, 0].map((share) => (
            <div
              key={share}
              className="absolute inset-x-0 border-t border-border"
              style={{ bottom: `${share * 100}%` }}
            />
          ))}
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="absolute inset-0 size-full overflow-visible"
          >
            <polygon
              points={`0,100 ${line} 100,100`}
              className="fill-chart-2 opacity-10"
            />
            <polyline
              points={line}
              fill="none"
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
              className="stroke-chart-2"
            />
          </svg>
          <div className="absolute inset-0 flex">
            {points.map(({ percent, views, share }) => (
              <div
                key={percent}
                tabIndex={0}
                className="group/point relative flex-1 outline-none"
              >
                <div className="pointer-events-none absolute inset-y-0 left-1/2 hidden border-l border-foreground/30 group-hover/point:block group-focus-visible/point:block" />
                <div
                  className="pointer-events-none absolute left-1/2 hidden size-2.5 -translate-x-1/2 translate-y-1/2 rounded-full bg-chart-2 ring-2 ring-background group-hover/point:block group-focus-visible/point:block"
                  style={{ bottom: `${share * 100}%` }}
                />
                <div className="pointer-events-none absolute top-0 left-1/2 z-10 hidden -translate-x-1/2 -translate-y-full rounded-md border bg-popover px-2 py-1 text-xs whitespace-nowrap text-popover-foreground shadow-md group-hover/point:block group-focus-visible/point:block">
                  <strong className="block tabular-nums">
                    {formatShare(share, i18n.language)}
                  </strong>
                  <span className="block text-muted-foreground">
                    {t("analytics.retention.point", { percent, count: views })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div
        className="flex justify-between pl-10 text-xs text-muted-foreground"
        aria-hidden
      >
        <span>{t("analytics.retention.start")}</span>
        <span>{t("analytics.retention.end")}</span>
      </div>
      <table className="sr-only">
        <caption>{t("analytics.retention.title")}</caption>
        <thead>
          <tr>
            <th>{t("analytics.table.position")}</th>
            <th>{t("analytics.table.views")}</th>
            <th>{t("analytics.table.share")}</th>
          </tr>
        </thead>
        <tbody>
          {points.map(({ percent, views, share }) => (
            <tr key={percent}>
              <td>{percent}%</td>
              <td>{views}</td>
              <td>{formatShare(share, i18n.language)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  )
}
