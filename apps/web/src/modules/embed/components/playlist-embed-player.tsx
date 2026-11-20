import { VIDEO_EMBED_QUERY_KEYS } from "@workspace/shared"
import { CircleAlertIcon, ListVideoIcon } from "lucide-react"
import { Suspense, lazy, useCallback, useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"

import {
  toResumeSeconds,
  toWatchedShare,
  useWatchProgress,
} from "../hooks/use-watch-progress"

import type { PlaylistEmbedSearch } from "../embed.schemas"
import type { PlaylistEmbedResult } from "../embed.types"
import type { PlaylistEmbed } from "@/api/generated-api"
import type { PlayerPlaylist } from "@/modules/libraries/libraries.types"

const VideoPlayer = lazy(() =>
  import("@/modules/libraries/components/video-player").then((module) => ({
    default: module.VideoPlayer,
  }))
)

type PlaylistEmbedPlayerProps = {
  result: PlaylistEmbedResult
  options: PlaylistEmbedSearch
}

/** The playlist's player filling the whole frame, or why it cannot play here. */
export function PlaylistEmbedPlayer({
  result,
  options,
}: PlaylistEmbedPlayerProps) {
  const { t } = useTranslation()

  if (!result.embed) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center text-sm text-white/80">
        <CircleAlertIcon className="size-5" />
        {t(`embed.unavailable.${result.unavailableReason}`)}
      </div>
    )
  }

  if (result.embed.videos.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center text-sm text-white/80">
        <ListVideoIcon className="size-5" />
        {t("embed.unavailable.playlist_empty")}
      </div>
    )
  }

  return <PlaylistPlayer embed={result.embed} options={options} />
}

/** Which video plays, where it starts, and whether it starts by itself. */
type PlaylistSelection = {
  index: number
  startSeconds: number | undefined
  autoPlay: boolean
}

/**
 * Plays one video of the playlist at a time in the same player, so
 * fullscreen and volume carry over from one video to the next. How far the
 * viewer got in each video is kept in their browser, for the episodes menu
 * and to resume where they left off.
 */
function PlaylistPlayer({
  embed,
  options,
}: {
  embed: PlaylistEmbed
  options: PlaylistEmbedSearch
}) {
  const [selection, setSelection] = useState<PlaylistSelection>(() => ({
    index: Math.max(
      0,
      embed.videos.findIndex(
        ({ videoId }) => videoId === options[VIDEO_EMBED_QUERY_KEYS.VIDEO]
      )
    ),
    startSeconds: options.t,
    autoPlay: options.autoplay ?? false,
  }))
  const video = embed.videos[selection.index]
  const { progressById, recordProgress } = useWatchProgress(
    embed.videos.map(({ videoId }) => videoId)
  )
  const playingRef = useRef(video)
  const hasResumedRef = useRef(false)

  playingRef.current = video

  // Resumes the first video once the stored progress is read, unless it was told where to start or already plays.
  useEffect(() => {
    if (
      hasResumedRef.current ||
      selection.startSeconds !== undefined ||
      selection.autoPlay
    ) {
      return
    }

    const resumeSeconds = toResumeSeconds(progressById[video.videoId])

    if (resumeSeconds === undefined) return

    hasResumedRef.current = true
    setSelection((current) => ({ ...current, startSeconds: resumeSeconds }))
  }, [progressById, selection, video.videoId])

  // Kept stable, so switching videos never records the last video's position for the next one.
  const handleTimeUpdate = useCallback(
    (seconds: number) => {
      if (seconds <= 0) return

      recordProgress(
        playingRef.current.videoId,
        seconds,
        playingRef.current.durationSeconds
      )
    },
    [recordProgress]
  )

  const selectEpisode = useCallback(
    (index: number) => {
      const next = embed.videos[index]

      hasResumedRef.current = true
      setSelection({
        index,
        startSeconds: toResumeSeconds(progressById[next.videoId]),
        autoPlay: true,
      })

      const url = new URL(window.location.href)

      url.searchParams.set(VIDEO_EMBED_QUERY_KEYS.VIDEO, next.videoId)
      url.searchParams.delete(VIDEO_EMBED_QUERY_KEYS.START)
      window.history.replaceState(window.history.state, "", url)
    },
    [embed.videos, progressById]
  )

  const playlist: PlayerPlaylist = {
    title: embed.title,
    episodes: embed.videos.map((each) => ({
      id: each.videoId,
      title: each.title,
      description: each.description,
      durationSeconds: each.durationSeconds,
      posterUrl: each.posterUrl,
    })),
    currentIndex: selection.index,
    watchedShares: Object.fromEntries(
      embed.videos.map(({ videoId }) => [
        videoId,
        toWatchedShare(progressById[videoId]),
      ])
    ),
    autoplayNext: embed.player.autoplayNext,
    onSelectEpisode: selectEpisode,
  }

  return (
    <Suspense
      fallback={
        <img
          src={video.posterUrl}
          alt=""
          className="size-full object-contain"
        />
      }
    >
      <VideoPlayer
        src={video.hlsUrl}
        poster={video.posterUrl}
        storyboardUrl={video.storyboardUrl}
        title={
          (options.title ?? embed.player.showTitle) ? video.title : undefined
        }
        autoPlay={selection.autoPlay}
        muted={options.muted || options.autoplay}
        startSeconds={selection.startSeconds}
        fill
        sendsCredentials={false}
        autoFocus={false}
        viewsUrl={video.viewsUrl}
        chapters={video.chapters}
        controls={embed.player}
        onTimeUpdate={handleTimeUpdate}
        playlist={playlist}
      />
    </Suspense>
  )
}
