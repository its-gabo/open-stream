import { PlayIcon, XIcon } from "lucide-react"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

import { PLAYER_UP_NEXT_COUNTDOWN_SECONDS } from "../libraries.constants"

import type { PlayerEpisode } from "../libraries.types"

type PlayerUpNextProps = {
  episode: PlayerEpisode
  /** Counts down and then plays the episode by itself. */
  autoplay: boolean
  onPlay: () => void
  onDismiss: () => void
}

/** Offers the next video once one ends; with `autoplay`, it starts after a countdown unless dismissed. */
export function PlayerUpNext({
  episode,
  autoplay,
  onPlay,
  onDismiss,
}: PlayerUpNextProps) {
  const { t } = useTranslation()
  const [secondsLeft, setSecondsLeft] = useState(
    PLAYER_UP_NEXT_COUNTDOWN_SECONDS
  )

  useEffect(() => {
    if (!autoplay) return

    if (secondsLeft <= 0) {
      onPlay()

      return
    }

    const timer = setTimeout(() => setSecondsLeft(secondsLeft - 1), 1000)

    return () => clearTimeout(timer)
  }, [autoplay, secondsLeft, onPlay])

  return (
    <div className="absolute right-3 bottom-20 flex w-[min(20rem,calc(100%-1.5rem))] flex-col gap-3 rounded-md bg-neutral-900/95 p-3 text-white shadow-2xl">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold" aria-live="polite">
          {autoplay
            ? t("videos.player.next_episode_in", { count: secondsLeft })
            : t("videos.player.next_episode")}
        </p>
        <button
          type="button"
          aria-label={t("videos.player.dismiss_next_episode")}
          className="flex size-7 items-center justify-center rounded-md hover:bg-white/15 focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none"
          onClick={onDismiss}
        >
          <XIcon className="size-4" />
        </button>
      </div>
      <button
        type="button"
        className="group/up-next flex items-center gap-3 rounded-sm text-left focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none"
        onClick={onPlay}
      >
        <span className="relative aspect-video w-28 shrink-0 overflow-hidden rounded-sm bg-black">
          <img
            src={episode.posterUrl}
            alt=""
            className="size-full object-cover"
          />
          <span className="absolute inset-0 flex items-center justify-center bg-black/30 transition group-hover/up-next:bg-black/10">
            <PlayIcon className="size-6 fill-current" />
          </span>
        </span>
        <span className="line-clamp-3 min-w-0 text-sm font-medium">
          {episode.title}
        </span>
      </button>
    </div>
  )
}
