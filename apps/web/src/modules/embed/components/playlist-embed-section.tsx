import { playlistEmbedPath } from "@workspace/shared"
import { useTranslation } from "react-i18next"

import { PLAYLIST_EMBED_SIZE } from "../embed.constants"
import { EmbedCodeSection } from "./embed-code-section"

import type { Playlist } from "@/api/generated-api"

type PlaylistEmbedSectionProps = {
  organizationSlug: string
  libraryId: string
  playlist: Playlist
}

/** The iframe code for putting the playlist on another site; viewers move between its videos in the player. */
export function PlaylistEmbedSection({
  organizationSlug,
  libraryId,
  playlist,
}: PlaylistEmbedSectionProps) {
  const { t } = useTranslation()

  return (
    <EmbedCodeSection
      organizationSlug={organizationSlug}
      libraryId={libraryId}
      embedPath={playlistEmbedPath(libraryId, playlist.id)}
      title={playlist.title}
      size={PLAYLIST_EMBED_SIZE}
      description={t("embed.section.playlist_description")}
    />
  )
}
