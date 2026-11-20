import { cn } from "@workspace/ui/lib/utils"
import { ChevronRightIcon } from "lucide-react"
import { useCallback, useRef, useState } from "react"
import { useTranslation } from "react-i18next"

import { usePlayerMenuDismiss } from "../hooks/use-player-menu-dismiss"
import { CHAPTER_THUMBNAIL_WIDTHS } from "../libraries.constants"
import {
  findChapterAt,
  findStoryboardCue,
  formatPlaybackTime,
} from "../libraries.utils"
import { PlayerMenuItem } from "./player-settings-menu"
import { StoryboardTile } from "./storyboard-tile"

import type { VideoChapter } from "@workspace/shared"
import type { StoryboardCue } from "../libraries.types"

type PlayerChaptersMenuProps = {
  chapters: VideoChapter[]
  currentSeconds: number
  storyboard: StoryboardCue[]
  onSeek: (seconds: number) => void
  onOpenChange: (isOpen: boolean) => void
}

/**
 * The chapter playing, which opens the list of chapters to jump to; drawn
 * inside the player like the settings menu, so it works in fullscreen.
 */
export function PlayerChaptersMenu({
  chapters,
  currentSeconds,
  storyboard,
  onSeek,
  onOpenChange,
}: PlayerChaptersMenuProps) {
  const { t } = useTranslation()
  const menuRef = useRef<HTMLDivElement>(null)
  const [isOpen, setIsOpen] = useState(false)
  const current = findChapterAt(chapters, currentSeconds)

  const changeOpen = useCallback(
    (next: boolean) => {
      setIsOpen(next)
      onOpenChange(next)
    },
    [onOpenChange]
  )
  const close = useCallback(() => changeOpen(false), [changeOpen])

  usePlayerMenuDismiss(menuRef, isOpen, close)

  return (
    <div ref={menuRef} className="relative min-w-0">
      <button
        type="button"
        className="flex h-9 max-w-full min-w-0 items-center gap-1 rounded-md px-2 text-sm text-white/90 hover:bg-white/15 focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none"
        aria-label={t("videos.player.chapters")}
        aria-expanded={isOpen}
        onClick={() => changeOpen(!isOpen)}
      >
        <span className="truncate">{current?.title}</span>
        <ChevronRightIcon
          className={cn(
            "size-4 shrink-0 transition-transform",
            isOpen && "-rotate-90"
          )}
        />
      </button>
      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 flex max-h-64 w-72 flex-col overflow-y-auto rounded-lg bg-black/85 p-1 text-sm text-white shadow-lg backdrop-blur">
          <p className="mb-1 border-b border-white/10 px-2.5 py-1.5 font-medium">
            {t("videos.player.chapters")}
          </p>
          {chapters.map((chapter) => {
            const cue = findStoryboardCue(storyboard, chapter.startSeconds)
            const isCurrent = chapter === current

            return (
              <PlayerMenuItem
                key={chapter.startSeconds}
                aria-current={isCurrent || undefined}
                className={cn(isCurrent && "bg-white/10")}
                onClick={() => {
                  onSeek(chapter.startSeconds)
                  changeOpen(false)
                }}
              >
                {cue && (
                  <StoryboardTile
                    cue={cue}
                    width={CHAPTER_THUMBNAIL_WIDTHS.PLAYER_MENU}
                    className="rounded"
                  />
                )}
                <span className="min-w-0 flex-1 truncate">{chapter.title}</span>
                <span className="shrink-0 text-xs text-white/70 tabular-nums">
                  {formatPlaybackTime(chapter.startSeconds)}
                </span>
              </PlayerMenuItem>
            )
          })}
        </div>
      )}
    </div>
  )
}
