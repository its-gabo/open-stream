import { useTranslation } from "react-i18next"

import { RankingList } from "./ranking-list"

import type {
  AnalyticsDevice,
  AnalyticsEmbeddingHost,
} from "@/api/generated-api"

type AnalyticsBreakdownsProps = {
  devices: AnalyticsDevice[]
  embeddingHosts: AnalyticsEmbeddingHost[]
}

/** Where the views came from: devices and the sites the player was embedded on. */
export function AnalyticsBreakdowns({
  devices,
  embeddingHosts,
}: AnalyticsBreakdownsProps) {
  const { t } = useTranslation()

  return (
    <>
      <RankingList
        title={t("analytics.devices.title")}
        emptyText={t("analytics.empty_period")}
        rows={devices.map(({ deviceType, views }) => ({
          key: deviceType,
          label: t(`analytics.devices.${deviceType}`),
          views,
        }))}
      />
      <RankingList
        title={t("analytics.sites.title")}
        emptyText={t("analytics.sites.empty")}
        rows={embeddingHosts.map(({ host, views }) => ({
          key: host,
          label: host,
          views,
        }))}
      />
    </>
  )
}
