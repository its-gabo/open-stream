import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@workspace/ui/components/sheet"
import { Skeleton } from "@workspace/ui/components/skeleton"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs"
import { useTranslation } from "react-i18next"
import { P, match } from "ts-pattern"

import { PLAYLIST_DETAILS_TABS } from "../libraries.constants"
import { PlaylistEditDialog } from "./playlist-edit-dialog"
import { PlaylistVideosEditor } from "./playlist-videos-editor"

import type { Playlist } from "@/api/generated-api"
import { usePlaylistQuery } from "@/api/queries/libraries/usePlaylistQuery"
import { PlaylistEmbedSection } from "@/modules/embed/components/playlist-embed-section"

type PlaylistDetailsSheetProps = {
  organizationSlug: string
  libraryId: string
  /** The playlist shown; the sheet is closed without one. */
  playlistId: string | undefined
  onClose: () => void
}

/** A playlist's videos, details and embed code, opened from the library's playlists. */
export function PlaylistDetailsSheet({
  organizationSlug,
  libraryId,
  playlistId,
  onClose,
}: PlaylistDetailsSheetProps) {
  const { data: playlist, isPending } = usePlaylistQuery(
    organizationSlug,
    libraryId,
    playlistId
  )

  return (
    <Sheet
      open={Boolean(playlistId)}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <SheetContent className="w-full overflow-y-auto data-[side=right]:sm:max-w-2xl">
        {match({ isPending, playlist })
          .with({ playlist: P.nonNullable }, ({ playlist: loaded }) => (
            <PlaylistDetails
              organizationSlug={organizationSlug}
              libraryId={libraryId}
              playlist={loaded}
            />
          ))
          .with({ isPending: true }, () => (
            <div className="flex flex-col gap-4 p-4">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-48 w-full" />
            </div>
          ))
          .otherwise(() => null)}
      </SheetContent>
    </Sheet>
  )
}

function PlaylistDetails({
  organizationSlug,
  libraryId,
  playlist,
}: Omit<PlaylistDetailsSheetProps, "playlistId" | "onClose"> & {
  playlist: Playlist
}) {
  const { t } = useTranslation()
  const hasPlayableVideo = playlist.durationSeconds > 0

  return (
    <>
      <SheetHeader className="pr-20">
        <SheetTitle className="truncate">{playlist.title}</SheetTitle>
        {playlist.description && (
          <SheetDescription className="line-clamp-2">
            {playlist.description}
          </SheetDescription>
        )}
      </SheetHeader>
      {/* Beside the sheet's close button, which sits at top-3 right-3. */}
      <div className="absolute top-3 right-12">
        <PlaylistEditDialog
          organizationSlug={organizationSlug}
          libraryId={libraryId}
          playlist={playlist}
        />
      </div>
      <div className="flex flex-col gap-4 px-4 pb-6">
        <Tabs defaultValue={PLAYLIST_DETAILS_TABS.VIDEOS} className="gap-4">
          {/* Wraps on narrow screens; each row keeps its own line, drawn by the background. */}
          <TabsList
            variant="line"
            className="w-full flex-wrap justify-start gap-x-5 gap-y-0 rounded-none bg-[linear-gradient(to_bottom,transparent_calc(2rem-1px),var(--color-border)_calc(2rem-1px))] bg-[length:100%_2rem] p-0 group-data-horizontal/tabs:h-auto"
          >
            <TabsTrigger
              value={PLAYLIST_DETAILS_TABS.VIDEOS}
              className="h-8 flex-none px-0 group-data-horizontal/tabs:after:bottom-0"
            >
              {t("playlists.tabs.videos")}
            </TabsTrigger>
            {hasPlayableVideo && (
              <TabsTrigger
                value={PLAYLIST_DETAILS_TABS.EMBED}
                className="h-8 flex-none px-0 group-data-horizontal/tabs:after:bottom-0"
              >
                {t("embed.section.title")}
              </TabsTrigger>
            )}
          </TabsList>
          <TabsContent value={PLAYLIST_DETAILS_TABS.VIDEOS}>
            <PlaylistVideosEditor
              organizationSlug={organizationSlug}
              libraryId={libraryId}
              playlist={playlist}
            />
          </TabsContent>
          {hasPlayableVideo && (
            <TabsContent value={PLAYLIST_DETAILS_TABS.EMBED}>
              <PlaylistEmbedSection
                organizationSlug={organizationSlug}
                libraryId={libraryId}
                playlist={playlist}
              />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </>
  )
}
