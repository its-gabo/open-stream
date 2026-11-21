import { VIDEO_CAPTION_KINDS } from "@workspace/shared"
import { cn } from "@workspace/ui/lib/utils"
import { CaptionsIcon, CheckIcon } from "lucide-react"
import { useCallback, useRef, useState } from "react"
import { useTranslation } from "react-i18next"

import { usePlayerMenuDismiss } from "../hooks/use-player-menu-dismiss"
import { PlayerMenuItem } from "./player-settings-menu"

import type { PlayerCaptionTrack } from "../libraries.types"

type PlayerCaptionsMenuProps = {
  tracks: PlayerCaptionTrack[]
  selectedTrackId: string | null
  onSelectTrack: (trackId: string | null) => void
  onOpenChange: (isOpen: boolean) => void
}

/**
 * Turns captions off or picks a track; drawn inside the player like the
 * settings menu, so it works in fullscreen. The button shows whether
 * captions are on.
 */
export function PlayerCaptionsMenu({
  tracks,
  selectedTrackId,
  onSelectTrack,
  onOpenChange,
}: PlayerCaptionsMenuProps) {
  const { t } = useTranslation()
  const menuRef = useRef<HTMLDivElement>(null)
  const [isOpen, setIsOpen] = useState(false)

  const changeOpen = useCallback(
    (next: boolean) => {
      setIsOpen(next)
      onOpenChange(next)
    },
    [onOpenChange]
  )
  const close = useCallback(() => changeOpen(false), [changeOpen])

  usePlayerMenuDismiss(menuRef, isOpen, close)

  const options = [
    { id: null, label: t("videos.player.captions_off") },
    ...tracks.map((track) => ({
      id: track.id,
      label:
        track.kind === VIDEO_CAPTION_KINDS.CAPTIONS
          ? t("videos.player.captions_track_cc", { label: track.label })
          : track.label,
    })),
  ]

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        className={cn(
          "relative flex size-9 items-center justify-center rounded-md text-white hover:bg-white/15 focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none [&_svg]:size-5",
          selectedTrackId &&
            "after:absolute after:inset-x-2 after:bottom-1 after:h-0.5 after:rounded-full after:bg-(--player-accent)"
        )}
        aria-label={t("videos.player.captions")}
        aria-expanded={isOpen}
        aria-pressed={Boolean(selectedTrackId)}
        title={t("videos.player.captions")}
        onClick={() => changeOpen(!isOpen)}
      >
        <CaptionsIcon />
      </button>
      {isOpen && (
        <div
          role="radiogroup"
          aria-label={t("videos.player.captions")}
          className="absolute right-0 bottom-full mb-2 max-h-72 w-56 overflow-y-auto rounded-lg bg-black/85 p-1 text-sm text-white shadow-lg backdrop-blur"
        >
          {options.map(({ id, label }) => (
            <PlayerMenuItem
              key={id ?? "off"}
              role="radio"
              aria-checked={id === selectedTrackId}
              onClick={() => {
                onSelectTrack(id)
                close()
              }}
            >
              <CheckIcon
                className={cn(
                  "size-4 shrink-0",
                  id === selectedTrackId ? "opacity-100" : "opacity-0"
                )}
              />
              <span className="truncate">{label}</span>
            </PlayerMenuItem>
          ))}
        </div>
      )}
    </div>
  )
}
