import { cn } from "@workspace/ui/lib/utils"
import { AudioLinesIcon, GalleryVerticalEndIcon, PlayIcon } from "lucide-react"
import { useCallback, useRef, useState } from "react"
import { useTranslation } from "react-i18next"

import { usePlayerMenuDismiss } from "../hooks/use-player-menu-dismiss"
import { formatPlaybackTime } from "../libraries.utils"
import { PlayerButton } from "./player-button"

import type { PlayerPlaylist } from "../libraries.types"

type PlayerEpisodesMenuProps = {
  playlist: PlayerPlaylist
  onOpenChange: (isOpen: boolean) => void
}

/**
 * The playlist's videos with how much of each was watched. The one playing
 * is opened up with its poster and description, or the one the pointer or
 * focus is on; picking another plays it. Drawn inside the player, so it
 * works in fullscreen.
 */
export function PlayerEpisodesMenu({
  playlist,
  onOpenChange,
}: PlayerEpisodesMenuProps) {
  const { t } = useTranslation()
  const menuRef = useRef<HTMLDivElement>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null)
  const expandedIndex = highlightedIndex ?? playlist.currentIndex

  const changeOpen = useCallback(
    (next: boolean) => {
      setIsOpen(next)
      setHighlightedIndex(null)
      onOpenChange(next)
    },
    [onOpenChange]
  )
  const close = useCallback(() => changeOpen(false), [changeOpen])

  usePlayerMenuDismiss(menuRef, isOpen, close)

  return (
    <div ref={menuRef} className="relative">
      <PlayerButton
        label={t("videos.player.episodes")}
        onClick={() => changeOpen(!isOpen)}
      >
        <GalleryVerticalEndIcon />
      </PlayerButton>
      {isOpen && (
        <div
          className="absolute right-0 bottom-full mb-3 flex max-h-[min(32rem,calc(100cqh-6rem))] w-[min(36rem,calc(100cqw-1.5rem))] flex-col overflow-hidden rounded-md bg-neutral-900/95 text-white shadow-2xl backdrop-blur"
          onPointerLeave={() => setHighlightedIndex(null)}
        >
          <p className="shrink-0 truncate px-5 pt-4 pb-3 text-lg font-semibold">
            {playlist.title}
          </p>
          <ol className="flex flex-col overflow-y-auto pb-2">
            {playlist.episodes.map((episode, index) => {
              const isCurrent = index === playlist.currentIndex
              const isExpanded = index === expandedIndex
              const watchedShare = playlist.watchedShares[episode.id] ?? 0

              return (
                <li key={episode.id}>
                  <button
                    type="button"
                    aria-current={isCurrent || undefined}
                    className={cn(
                      "flex w-full flex-col border-2 border-transparent px-5 py-3 text-left transition-colors duration-300 ease-out outline-none motion-reduce:transition-none",
                      isExpanded && "bg-black/40",
                      "focus-visible:border-white"
                    )}
                    onPointerEnter={() => setHighlightedIndex(index)}
                    onFocus={() => setHighlightedIndex(index)}
                    onClick={() => {
                      if (!isCurrent) playlist.onSelectEpisode(index)
                      close()
                    }}
                  >
                    <span className="flex w-full items-center gap-4">
                      <span className="w-5 shrink-0 text-right font-semibold tabular-nums">
                        {index + 1}
                      </span>
                      <span className="min-w-0 flex-1 truncate font-semibold">
                        {episode.title}
                      </span>
                      <span
                        className="h-0.5 w-16 shrink-0 bg-white/30 sm:w-24"
                        role="progressbar"
                        aria-label={t("videos.player.watched")}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={Math.round(watchedShare * 100)}
                      >
                        <span
                          className="block h-full bg-[var(--player-accent)]"
                          style={{ width: `${watchedShare * 100}%` }}
                        />
                      </span>
                    </span>
                    {/* Always rendered, so opening and closing can ease the row's height from 0fr to 1fr. */}
                    <span
                      aria-hidden={!isExpanded}
                      className={cn(
                        "grid w-full transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none",
                        isExpanded
                          ? "grid-rows-[1fr] opacity-100"
                          : "grid-rows-[0fr] opacity-0"
                      )}
                    >
                      <span className="min-h-0 overflow-hidden">
                        <span className="flex w-full gap-4 pt-3 pl-9">
                          <span className="relative aspect-video w-32 shrink-0 overflow-hidden rounded-sm bg-black sm:w-40">
                            <img
                              src={episode.posterUrl}
                              alt=""
                              loading="lazy"
                              className={cn(
                                "size-full object-cover",
                                isCurrent && "opacity-40"
                              )}
                            />
                            <span className="absolute inset-0 flex items-center justify-center gap-1.5 text-sm font-semibold">
                              {isCurrent ? (
                                <>
                                  <AudioLinesIcon className="size-5" />
                                  {t("videos.player.now_playing")}
                                </>
                              ) : (
                                <span className="flex size-9 items-center justify-center rounded-full border border-white/70 bg-black/50">
                                  <PlayIcon className="ml-0.5 size-4 fill-current" />
                                </span>
                              )}
                            </span>
                          </span>
                          <span className="flex min-w-0 flex-col gap-1 text-sm">
                            <span className="text-xs text-white/60 tabular-nums">
                              {formatPlaybackTime(episode.durationSeconds)}
                            </span>
                            {episode.description && (
                              <span className="line-clamp-4 text-white/85">
                                {episode.description}
                              </span>
                            )}
                          </span>
                        </span>
                      </span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ol>
        </div>
      )}
    </div>
  )
}
