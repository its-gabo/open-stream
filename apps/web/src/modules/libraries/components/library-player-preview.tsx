import {
  CaptionsIcon,
  ChevronRightIcon,
  MaximizeIcon,
  PictureInPicture2Icon,
  PlayIcon,
  SettingsIcon,
  Volume2Icon,
} from "lucide-react"
import { useTranslation } from "react-i18next"

import { LIBRARY_PLAYER_PREVIEW_CHAPTER_BREAKS } from "../libraries.constants"
import { segmentFill, toSliderSegments } from "../libraries.utils"

import type { LibraryPlayerFormValues } from "../libraries.types"

/** Where the still's seek bar shows playback and buffering, from 0 to 1. */
const PREVIEW_PROGRESS = 0.4
const PREVIEW_BUFFERED = 0.6

type LibraryPlayerPreviewProps = {
  settings: LibraryPlayerFormValues
}

/** A still of the player's controls as embeds will show them; not a working player. */
export function LibraryPlayerPreview({ settings }: LibraryPlayerPreviewProps) {
  const { t } = useTranslation()

  return (
    <div
      aria-hidden
      className="relative flex aspect-video w-full flex-col justify-between overflow-hidden rounded-lg bg-gradient-to-br from-zinc-700 via-zinc-800 to-zinc-950 text-white"
    >
      <div className="bg-gradient-to-b from-black/70 to-transparent px-4 pt-3 pb-8">
        {settings.showTitle && (
          <p className="truncate text-sm font-medium">
            {t("libraries.player.preview_title")}
          </p>
        )}
      </div>
      <div className="flex flex-col gap-2 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-3 pt-10 pb-3">
        <div className="relative flex h-1 w-full gap-0.5">
          {toSliderSegments(
            settings.showChapters ? LIBRARY_PLAYER_PREVIEW_CHAPTER_BREAKS : []
          ).map(({ start, end }) => (
            <div
              key={start}
              className="relative h-full overflow-hidden rounded-full bg-white/25"
              style={{ flexGrow: end - start, flexBasis: 0 }}
            >
              <div
                className="absolute inset-y-0 left-0 bg-white/35"
                style={{
                  width: segmentFill(PREVIEW_BUFFERED, start, end),
                }}
              />
              <div
                className="absolute inset-y-0 left-0"
                style={{
                  width: segmentFill(PREVIEW_PROGRESS, start, end),
                  backgroundColor: settings.accentColor,
                }}
              />
            </div>
          ))}
          <div
            className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full shadow"
            style={{
              left: `${PREVIEW_PROGRESS * 100}%`,
              backgroundColor: settings.accentColor,
            }}
          />
        </div>
        <div className="flex items-center gap-3 [&_svg]:size-4">
          <PlayIcon className="fill-current" />
          <Volume2Icon />
          <span className="text-xs text-white/90 tabular-nums">
            0:42
            <span className="text-white/60"> / 1:45</span>
          </span>
          {settings.showChapters && (
            <span className="flex min-w-0 items-center gap-0.5 text-xs text-white/90">
              <span className="truncate">
                {t("libraries.player.preview_chapter")}
              </span>
              <ChevronRightIcon />
            </span>
          )}
          <div className="ml-auto flex items-center gap-3">
            {settings.showCaptions && <CaptionsIcon />}
            {settings.showSettingsMenu && <SettingsIcon />}
            {settings.showPictureInPicture && <PictureInPicture2Icon />}
            {settings.showFullscreen && <MaximizeIcon />}
          </div>
        </div>
      </div>
    </div>
  )
}
