import {
  MaximizeIcon,
  PictureInPicture2Icon,
  PlayIcon,
  SettingsIcon,
  Volume2Icon,
} from "lucide-react"
import { useTranslation } from "react-i18next"

import type { LibraryPlayerFormValues } from "../libraries.types"

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
        <div className="relative h-1 w-full rounded-full bg-white/25">
          <div className="absolute inset-y-0 left-0 w-3/5 rounded-full bg-white/35" />
          <div
            className="absolute inset-y-0 left-0 w-2/5 rounded-full"
            style={{ backgroundColor: settings.accentColor }}
          />
          <div
            className="absolute top-1/2 left-2/5 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full shadow"
            style={{ backgroundColor: settings.accentColor }}
          />
        </div>
        <div className="flex items-center gap-3 [&_svg]:size-4">
          <PlayIcon className="fill-current" />
          <Volume2Icon />
          <span className="text-xs text-white/90 tabular-nums">
            0:42
            <span className="text-white/60"> / 1:45</span>
          </span>
          <div className="ml-auto flex items-center gap-3">
            {settings.showSettingsMenu && <SettingsIcon />}
            {settings.showPictureInPicture && <PictureInPicture2Icon />}
            {settings.showFullscreen && <MaximizeIcon />}
          </div>
        </div>
      </div>
    </div>
  )
}
