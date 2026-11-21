import {
  DEFAULT_LIBRARY_PLAYER_SETTINGS,
  VIDEO_PROCESSING_STATUSES,
} from "@workspace/shared"
import { Label } from "@workspace/ui/components/label"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@workspace/ui/components/sheet"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Switch } from "@workspace/ui/components/switch"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs"
import { FilmIcon } from "lucide-react"
import { ClientOnly } from "@tanstack/react-router"
import { Suspense, lazy, useState } from "react"
import { useTranslation } from "react-i18next"

import { VIDEO_DETAILS_TABS, VIDEO_PLAYER_PATHS } from "../libraries.constants"
import {
  buildVideoCaptionUrl,
  buildVideoFileUrl,
  buildVideoPosterUrl,
} from "../libraries.utils"
import { VideoCaptionsSection } from "./video-captions-section"
import { VideoChaptersSection } from "./video-chapters-section"
import { VideoCtasSection } from "./video-ctas-section"
import { VideoEditDialog } from "./video-edit-dialog"
import { VideoFacts } from "./video-facts"
import { VideoPosterSection } from "./video-poster-section"

import type { Video } from "@/api/generated-api"
import { useLibraryPlayerQuery } from "@/api/queries/libraries/useLibraryPlayerQuery"
import { useVideoCaptionsQuery } from "@/api/queries/libraries/useVideoCaptionsQuery"
import { useVideoCtasQuery } from "@/api/queries/libraries/useVideoCtasQuery"
import { VideoAnalyticsSection } from "@/modules/analytics/components/video-analytics-section"
import { VideoEmbedSection } from "@/modules/embed/components/video-embed-section"

const VideoPlayer = lazy(() =>
  import("./video-player").then((module) => ({ default: module.VideoPlayer }))
)

type VideoDetailsSheetProps = {
  organizationSlug: string
  libraryId: string
  /** The video shown; the sheet is closed while null. */
  video: Video | null
  onClose: () => void
}

/** A video's player and details, opened from the library's video list. */
export function VideoDetailsSheet({
  organizationSlug,
  libraryId,
  video,
  onClose,
}: VideoDetailsSheetProps) {
  return (
    <Sheet
      open={Boolean(video)}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <SheetContent className="w-full overflow-y-auto data-[side=right]:sm:max-w-2xl">
        {video && (
          <VideoDetails
            organizationSlug={organizationSlug}
            libraryId={libraryId}
            video={video}
          />
        )}
      </SheetContent>
    </Sheet>
  )
}

function VideoDetails({
  organizationSlug,
  libraryId,
  video,
}: Omit<VideoDetailsSheetProps, "video" | "onClose"> & { video: Video }) {
  const { t } = useTranslation()
  const [playerSeconds, setPlayerSeconds] = useState(0)
  const [showsDefaultPlayer, setShowsDefaultPlayer] = useState(false)
  const isPlayable = video.processingStatus === VIDEO_PROCESSING_STATUSES.READY
  const libraryPlayer = useLibraryPlayerQuery(organizationSlug, libraryId, {
    enabled: isPlayable,
  })
  // Previewed in the player, which reports nothing here.
  const { data: ctas } = useVideoCtasQuery(
    organizationSlug,
    libraryId,
    video.id,
    { enabled: isPlayable }
  )
  const { data: captionsData } = useVideoCaptionsQuery(
    organizationSlug,
    libraryId,
    video.id,
    { enabled: isPlayable }
  )
  const captions = (captionsData?.captions ?? []).map((caption) => ({
    ...caption,
    url: buildVideoCaptionUrl(organizationSlug, libraryId, video.id, caption),
  }))
  // The library's player as its embeds show it; the stock one if its settings cannot be read.
  const playerSettings =
    showsDefaultPlayer || !libraryPlayer.data
      ? DEFAULT_LIBRARY_PLAYER_SETTINGS
      : libraryPlayer.data
  const embedSize =
    isPlayable && video.width !== null && video.height !== null
      ? { width: video.width, height: video.height }
      : null

  return (
    <>
      <SheetHeader className="pr-20">
        <SheetTitle className="truncate">{video.title}</SheetTitle>
        {video.description && (
          <SheetDescription className="line-clamp-2">
            {video.description}
          </SheetDescription>
        )}
      </SheetHeader>
      {/* Beside the sheet's close button, which sits at top-3 right-3. */}
      <div className="absolute top-3 right-12">
        <VideoEditDialog
          organizationSlug={organizationSlug}
          libraryId={libraryId}
          video={video}
        />
      </div>
      <div className="flex flex-col gap-4 px-4 pb-6">
        {isPlayable && libraryPlayer.isPending && (
          <Skeleton className="aspect-video w-full rounded-lg" />
        )}
        {isPlayable && !libraryPlayer.isPending && (
          <div className="flex flex-col gap-2">
            <ClientOnly
              fallback={<Skeleton className="aspect-video w-full rounded-lg" />}
            >
              <Suspense
                fallback={
                  <Skeleton className="aspect-video w-full rounded-lg" />
                }
              >
                <VideoPlayer
                  src={buildVideoFileUrl(
                    organizationSlug,
                    libraryId,
                    video,
                    VIDEO_PLAYER_PATHS.MASTER_PLAYLIST
                  )}
                  poster={buildVideoPosterUrl(
                    organizationSlug,
                    libraryId,
                    video
                  )}
                  storyboardUrl={buildVideoFileUrl(
                    organizationSlug,
                    libraryId,
                    video,
                    VIDEO_PLAYER_PATHS.STORYBOARD
                  )}
                  title={playerSettings.showTitle ? video.title : undefined}
                  chapters={video.chapters}
                  ctas={ctas}
                  captions={captions}
                  controls={playerSettings}
                  onTimeUpdate={setPlayerSeconds}
                />
              </Suspense>
            </ClientOnly>
            <div className="flex items-center gap-2">
              <Switch
                id="video-default-player"
                checked={showsDefaultPlayer}
                onCheckedChange={setShowsDefaultPlayer}
              />
              <Label
                htmlFor="video-default-player"
                className="text-xs font-normal text-muted-foreground"
              >
                {t("videos.details.default_player")}
              </Label>
            </div>
          </div>
        )}
        {!isPlayable && (
          <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-lg bg-muted p-6 text-center text-sm text-muted-foreground">
            <FilmIcon className="size-5" />
            {t("videos.details.not_playable")}
          </div>
        )}
        <Tabs defaultValue={VIDEO_DETAILS_TABS.DETAILS} className="gap-4">
          {/* Wraps on narrow screens; each row keeps its own line, drawn by the background. */}
          <TabsList
            variant="line"
            className="w-full flex-wrap justify-start gap-x-5 gap-y-0 rounded-none bg-[linear-gradient(to_bottom,transparent_calc(2rem-1px),var(--color-border)_calc(2rem-1px))] bg-[length:100%_2rem] p-0 group-data-horizontal/tabs:h-auto"
          >
            <TabsTrigger
              value={VIDEO_DETAILS_TABS.DETAILS}
              className="h-8 flex-none px-0 group-data-horizontal/tabs:after:bottom-0"
            >
              {t("videos.details.title")}
            </TabsTrigger>
            {isPlayable && (
              <TabsTrigger
                value={VIDEO_DETAILS_TABS.THUMBNAIL}
                className="h-8 flex-none px-0 group-data-horizontal/tabs:after:bottom-0"
              >
                {t("videos.poster.title")}
              </TabsTrigger>
            )}
            {isPlayable && (
              <TabsTrigger
                value={VIDEO_DETAILS_TABS.CHAPTERS}
                className="h-8 flex-none px-0 group-data-horizontal/tabs:after:bottom-0"
              >
                {t("videos.chapters.title")}
              </TabsTrigger>
            )}
            {isPlayable && (
              <TabsTrigger
                value={VIDEO_DETAILS_TABS.CTAS}
                className="h-8 flex-none px-0 group-data-horizontal/tabs:after:bottom-0"
              >
                {t("videos.ctas.title")}
              </TabsTrigger>
            )}
            {isPlayable && (
              <TabsTrigger
                value={VIDEO_DETAILS_TABS.CAPTIONS}
                className="h-8 flex-none px-0 group-data-horizontal/tabs:after:bottom-0"
              >
                {t("videos.captions.title")}
              </TabsTrigger>
            )}
            {isPlayable && (
              <TabsTrigger
                value={VIDEO_DETAILS_TABS.ANALYTICS}
                className="h-8 flex-none px-0 group-data-horizontal/tabs:after:bottom-0"
              >
                {t("analytics.video.title")}
              </TabsTrigger>
            )}
            {embedSize && (
              <TabsTrigger
                value={VIDEO_DETAILS_TABS.EMBED}
                className="h-8 flex-none px-0 group-data-horizontal/tabs:after:bottom-0"
              >
                {t("embed.section.title")}
              </TabsTrigger>
            )}
          </TabsList>
          <TabsContent
            value={VIDEO_DETAILS_TABS.DETAILS}
            className="flex flex-col gap-4"
          >
            <VideoFacts video={video} />
          </TabsContent>
          {isPlayable && (
            <TabsContent value={VIDEO_DETAILS_TABS.THUMBNAIL}>
              <VideoPosterSection
                organizationSlug={organizationSlug}
                libraryId={libraryId}
                video={video}
                currentSeconds={playerSeconds}
              />
            </TabsContent>
          )}
          {isPlayable && (
            <TabsContent value={VIDEO_DETAILS_TABS.CHAPTERS}>
              <VideoChaptersSection
                organizationSlug={organizationSlug}
                libraryId={libraryId}
                video={video}
                currentSeconds={playerSeconds}
              />
            </TabsContent>
          )}
          {isPlayable && (
            <TabsContent value={VIDEO_DETAILS_TABS.CTAS}>
              <VideoCtasSection
                organizationSlug={organizationSlug}
                libraryId={libraryId}
                video={video}
                currentSeconds={playerSeconds}
              />
            </TabsContent>
          )}
          {isPlayable && (
            <TabsContent value={VIDEO_DETAILS_TABS.CAPTIONS}>
              <VideoCaptionsSection
                organizationSlug={organizationSlug}
                libraryId={libraryId}
                video={video}
              />
            </TabsContent>
          )}
          {isPlayable && (
            <TabsContent value={VIDEO_DETAILS_TABS.ANALYTICS}>
              <VideoAnalyticsSection
                organizationSlug={organizationSlug}
                libraryId={libraryId}
                videoId={video.id}
              />
            </TabsContent>
          )}
          {embedSize && (
            <TabsContent value={VIDEO_DETAILS_TABS.EMBED}>
              <VideoEmbedSection
                organizationSlug={organizationSlug}
                libraryId={libraryId}
                video={{ ...video, ...embedSize }}
              />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </>
  )
}
