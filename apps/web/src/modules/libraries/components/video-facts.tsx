import { Badge } from "@workspace/ui/components/badge"
import { useTranslation } from "react-i18next"

import { formatDuration, formatFileSize } from "../libraries.utils"
import { FigureStrip } from "./figure-strip"

import type { Video } from "@/api/generated-api"

/**
 * What is known about a video, read only, laid out like its analytics: the
 * headline figures in one strip, then its qualities and processing history.
 * Figures not known yet show a dash, so the strip keeps its shape.
 */
export function VideoFacts({ video }: { video: Video }) {
  const { t, i18n } = useTranslation()
  const formatDate = (value: string | null) =>
    value
      ? new Intl.DateTimeFormat(i18n.language, {
          dateStyle: "medium",
          timeStyle: "short",
        }).format(new Date(value))
      : null
  const tiles = [
    {
      key: "duration",
      value:
        video.durationSeconds !== null
          ? formatDuration(video.durationSeconds)
          : null,
    },
    {
      key: "resolution",
      value:
        video.width !== null && video.height !== null
          ? `${video.width}×${video.height}`
          : null,
    },
    {
      key: "size",
      value:
        video.sizeBytes !== null
          ? formatFileSize(video.sizeBytes, i18n.language)
          : null,
    },
    { key: "format", value: video.fileFormat?.toUpperCase() ?? null },
  ]
  const history = [
    { key: "created", value: formatDate(video.createdAt) },
    { key: "uploaded", value: formatDate(video.uploadedAt) },
    { key: "processed", value: formatDate(video.processedAt) },
  ].filter((row): row is { key: string; value: string } => row.value !== null)

  return (
    <div className="flex flex-col gap-4">
      <FigureStrip
        figures={tiles.map(({ key, value }) => ({
          key,
          label: t(`videos.details.fields.${key}`),
          value,
        }))}
      />
      <dl className="flex flex-col divide-y rounded-lg border px-4 py-1.5 text-sm">
        <div className="flex items-center justify-between gap-4 py-2.5">
          <dt className="text-muted-foreground">
            {t("videos.details.fields.qualities")}
          </dt>
          <dd className="flex flex-wrap justify-end gap-1">
            {video.renditions.length > 0
              ? video.renditions.map(({ quality }) => (
                  <Badge key={quality} variant="secondary">
                    {quality}
                  </Badge>
                ))
              : "—"}
          </dd>
        </div>
        {history.map(({ key, value }) => (
          <div
            key={key}
            className="flex items-center justify-between gap-4 py-2.5"
          >
            <dt className="text-muted-foreground">
              {t(`videos.details.fields.${key}`)}
            </dt>
            <dd className="text-right tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
