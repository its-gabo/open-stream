import { CircleAlertIcon } from "lucide-react"
import { Suspense, lazy } from "react"
import { useTranslation } from "react-i18next"

import type { VideoEmbedSearch } from "../embed.schemas"
import type { VideoEmbedResult } from "../embed.types"

const VideoPlayer = lazy(() =>
  import("@/modules/libraries/components/video-player").then((module) => ({
    default: module.VideoPlayer,
  }))
)

type VideoEmbedPlayerProps = {
  result: VideoEmbedResult
  options: VideoEmbedSearch
}

/** The player filling the whole frame, or why the video cannot play here. */
export function VideoEmbedPlayer({ result, options }: VideoEmbedPlayerProps) {
  const { t } = useTranslation()

  if (!result.embed) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center text-sm text-white/80">
        <CircleAlertIcon className="size-5" />
        {t(`embed.unavailable.${result.unavailableReason}`)}
      </div>
    )
  }

  const { embed } = result

  return (
    <Suspense
      fallback={
        <img
          src={embed.posterUrl}
          alt=""
          className="size-full object-contain"
        />
      }
    >
      <VideoPlayer
        src={embed.hlsUrl}
        poster={embed.posterUrl}
        storyboardUrl={embed.storyboardUrl}
        title={
          (options.title ?? embed.player.showTitle) ? embed.title : undefined
        }
        autoPlay={options.autoplay}
        muted={options.muted || options.autoplay}
        loop={options.loop}
        startSeconds={options.t}
        fill
        sendsCredentials={false}
        autoFocus={false}
        viewsUrl={embed.viewsUrl}
        controls={embed.player}
      />
    </Suspense>
  )
}
