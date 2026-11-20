import { videoEmbedPath } from "@workspace/shared"
import { useTranslation } from "react-i18next"

import { EmbedCodeSection } from "./embed-code-section"

import type { Video } from "@/api/generated-api"

type VideoEmbedSectionProps = {
  organizationSlug: string
  libraryId: string
  /** A processed video, so its size is known. */
  video: Video & { width: number; height: number }
}

/** The iframe code for putting the video on another site, with the player's options. */
export function VideoEmbedSection({
  organizationSlug,
  libraryId,
  video,
}: VideoEmbedSectionProps) {
  const { t } = useTranslation()

  return (
    <EmbedCodeSection
      organizationSlug={organizationSlug}
      libraryId={libraryId}
      embedPath={videoEmbedPath(libraryId, video.id)}
      title={video.title}
      size={video}
      videoDurationSeconds={video.durationSeconds ?? 0}
      description={t("embed.section.description")}
    />
  )
}
