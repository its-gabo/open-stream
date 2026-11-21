import { VIDEO_CTA_KINDS } from "@workspace/shared"
import { useTranslation } from "react-i18next"

import { formatShare } from "../analytics.utils"
import { AnalyticsCard } from "./analytics-card"

import type { CtaAnalytics } from "@/api/generated-api"

type CtaBreakdownProps = {
  ctas: CtaAnalytics[]
}

/**
 * What views did with each call to action: how many showed it, and of
 * those, the share that answered it by opening its link or leaving an email
 * address, and the share that closed it.
 */
export function CtaBreakdown({ ctas }: CtaBreakdownProps) {
  const { t, i18n } = useTranslation()
  const shareOf = (views: number, shownViews: number) =>
    formatShare(shownViews > 0 ? views / shownViews : 0, i18n.language)

  return (
    <AnalyticsCard
      title={t("analytics.ctas.title")}
      description={t("analytics.ctas.description")}
    >
      <table className="w-full text-sm">
        <thead className="text-xs text-muted-foreground">
          <tr>
            <th className="pb-2 text-left font-normal">
              {t("analytics.ctas.columns.cta")}
            </th>
            <th className="pb-2 text-right font-normal">
              {t("analytics.ctas.columns.shown")}
            </th>
            <th className="pb-2 text-right font-normal">
              {t("analytics.ctas.columns.answered")}
            </th>
            <th className="pb-2 text-right font-normal">
              {t("analytics.ctas.columns.dismissed")}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {ctas.map((cta) => {
            const answeredViews =
              cta.kind === VIDEO_CTA_KINDS.EMAIL
                ? cta.submittedViews
                : cta.clickedViews

            return (
              <tr key={cta.ctaId}>
                <td className="max-w-0 py-2 pr-3">
                  <div className="truncate font-medium">{cta.heading}</div>
                  <div className="truncate text-xs text-muted-foreground">
                    {t(`analytics.ctas.answers.${cta.kind}`, {
                      count: answeredViews,
                    })}
                  </div>
                </td>
                <td className="py-2 text-right tabular-nums">
                  {cta.shownViews.toLocaleString(i18n.language)}
                </td>
                <td className="py-2 text-right font-medium tabular-nums">
                  {shareOf(answeredViews, cta.shownViews)}
                </td>
                <td className="py-2 text-right text-muted-foreground tabular-nums">
                  {shareOf(cta.dismissedViews, cta.shownViews)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </AnalyticsCard>
  )
}
