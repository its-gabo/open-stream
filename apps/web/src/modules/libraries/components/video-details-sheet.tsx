import { VIDEO_PROCESSING_STATUSES } from "@workspace/shared"
import {
  Sheet,
  SheetContent,
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
import { FilmIcon } from "lucide-react"
import { Suspense, lazy } from "react"
import { useTranslation } from "react-i18next"

import { VIDEO_DETAILS_TABS, VIDEO_PLAYER_PATHS } from "../libraries.constants"
import {
  buildVideoFileUrl,
  buildVideoPosterUrl,
  formatDuration,
  formatFileSize,
} from "../libraries.utils"

import type { Video } from "@/api/generated-api"
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
  const { t, i18n } = useTranslation()
  const isPlayable = video.processingStatus === VIDEO_PROCESSING_STATUSES.READY
  const embedSize =
    isPlayable && video.width !== null && video.height !== null
      ? { width: video.width, height: video.height }
      : null
  const formatDate = (value: string | null) =>
    value
      ? new Intl.DateTimeFormat(i18n.language, {
          dateStyle: "medium",
          timeStyle: "short",
        }).format(new Date(value))
      : null
  const details = [
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
      key: "qualities",
      value: video.renditions.map(({ quality }) => quality).join(", ") || null,
    },
    { key: "file_name", value: video.fileName },
    { key: "format", value: video.fileFormat?.toUpperCase() ?? null },
    {
      key: "size",
      value:
        video.sizeBytes !== null
          ? formatFileSize(video.sizeBytes, i18n.language)
          : null,
    },
    { key: "created", value: formatDate(video.createdAt) },
    { key: "uploaded", value: formatDate(video.uploadedAt) },
    { key: "processed", value: formatDate(video.processedAt) },
  ].filter(({ value }) => value)

  return (
    <>
      <SheetHeader className="pr-12">
        <SheetTitle className="truncate">{video.title}</SheetTitle>
      </SheetHeader>
      <div className="flex flex-col gap-6 px-4 pb-6">
        {isPlayable ? (
          <Suspense
            fallback={<Skeleton className="aspect-video w-full rounded-lg" />}
          >
            <VideoPlayer
              src={buildVideoFileUrl(
                organizationSlug,
                libraryId,
                video,
                VIDEO_PLAYER_PATHS.MASTER_PLAYLIST
              )}
              poster={buildVideoPosterUrl(organizationSlug, libraryId, video)}
              storyboardUrl={buildVideoFileUrl(
                organizationSlug,
                libraryId,
                video,
                VIDEO_PLAYER_PATHS.STORYBOARD
              )}
            />
          </Suspense>
        ) : (
          <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-lg bg-muted p-6 text-center text-sm text-muted-foreground">
            <FilmIcon className="size-5" />
            {t("videos.details.not_playable")}
          </div>
        )}
        <Tabs defaultValue={VIDEO_DETAILS_TABS.DETAILS} className="gap-4">
          <TabsList
            variant="line"
            className="h-11 w-full justify-start gap-5 rounded-none border-b"
          >
            <TabsTrigger
              value={VIDEO_DETAILS_TABS.DETAILS}
              className="h-full flex-none px-0"
            >
              {t("videos.details.title")}
            </TabsTrigger>
            {isPlayable && (
              <TabsTrigger
                value={VIDEO_DETAILS_TABS.ANALYTICS}
                className="h-full flex-none px-0"
              >
                {t("analytics.video.title")}
              </TabsTrigger>
            )}
            {embedSize && (
              <TabsTrigger
                value={VIDEO_DETAILS_TABS.EMBED}
                className="h-full flex-none px-0"
              >
                {t("embed.section.title")}
              </TabsTrigger>
            )}
          </TabsList>
          <TabsContent value={VIDEO_DETAILS_TABS.DETAILS}>
            <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
              {details.map(({ key, value }) => (
                <div key={key} className="contents">
                  <dt className="text-muted-foreground">
                    {t(`videos.details.fields.${key}`)}
                  </dt>
                  <dd className="min-w-0 break-words">{value}</dd>
                </div>
              ))}
            </dl>
          </TabsContent>
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
