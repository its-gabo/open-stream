import { SkipForwardIcon } from "lucide-react"
import { useTranslation } from "react-i18next"

import type { PlayerEpisode } from "../libraries.types"

type PlayerNextEpisodeButtonProps = {
  episode: PlayerEpisode
  onClick: () => void
}

/** Plays the next video of the playlist; hovering or focusing it shows which one that is. */
export function PlayerNextEpisodeButton({
  episode,
  onClick,
}: PlayerNextEpisodeButtonProps) {
  const { t } = useTranslation()

  return (
    <div className="group/next relative">
      <button
        type="button"
        aria-label={t("videos.player.next_episode_named", {
          title: episode.title,
        })}
        className="flex size-9 shrink-0 items-center justify-center rounded-md text-white hover:bg-white/15 focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none [&_svg]:size-5"
        onClick={onClick}
      >
        <SkipForwardIcon className="fill-current" />
      </button>
      <div className="pointer-events-none absolute right-0 bottom-full mb-3 hidden w-72 flex-col overflow-hidden rounded-md bg-neutral-900/95 text-white shadow-2xl group-focus-within/next:flex group-hover/next:flex">
        <p className="px-3 pt-2.5 pb-2 text-sm font-semibold">
          {t("videos.player.next_episode")}
        </p>
        <div className="flex gap-3 bg-black/40 p-3">
          <img
            src={episode.posterUrl}
            alt=""
            className="aspect-video w-24 shrink-0 rounded-sm object-cover"
          />
          <div className="flex min-w-0 flex-col gap-1">
            <p className="line-clamp-2 text-sm font-medium">{episode.title}</p>
            {episode.description && (
              <p className="line-clamp-2 text-xs text-white/70">
                {episode.description}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
