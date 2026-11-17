import { ANALYTICS_PERIODS_DAYS } from "@workspace/shared"
import { Tabs, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"
import { useTranslation } from "react-i18next"

import type { AnalyticsPeriodDays } from "@workspace/shared"

type AnalyticsPeriodTabsProps = {
  days: AnalyticsPeriodDays
  onChange: (days: AnalyticsPeriodDays) => void
}

/** Picks how many days back the analytics cover. */
export function AnalyticsPeriodTabs({
  days,
  onChange,
}: AnalyticsPeriodTabsProps) {
  const { t } = useTranslation()

  return (
    <Tabs
      value={String(days)}
      onValueChange={(value) => {
        const picked = ANALYTICS_PERIODS_DAYS.find(
          (each) => String(each) === value
        )

        if (picked) onChange(picked)
      }}
    >
      <TabsList aria-label={t("analytics.period.label")}>
        {ANALYTICS_PERIODS_DAYS.map((each) => (
          <TabsTrigger key={each} value={String(each)}>
            {t("analytics.period.days", { count: each })}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}
