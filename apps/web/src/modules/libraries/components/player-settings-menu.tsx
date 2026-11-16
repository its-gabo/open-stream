import { cn } from "@workspace/ui/lib/utils"
import {
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  SettingsIcon,
} from "lucide-react"
import { useHotkey } from "@tanstack/react-hotkeys"
import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { match } from "ts-pattern"

import {
  AUTO_QUALITY_LEVEL,
  PLAYBACK_RATES,
  PLAYER_SETTINGS_VIEWS,
} from "../libraries.constants"

import type { ComponentProps } from "react"
import type { PlayerSettingsView, VideoPlayerQuality } from "../libraries.types"

type PlayerSettingsMenuProps = {
  qualities: VideoPlayerQuality[]
  selectedLevel: number
  playingHeight: number | undefined
  onSelectLevel: (level: number) => void
  playbackRate: number
  onSelectRate: (rate: number) => void
  onOpenChange: (isOpen: boolean) => void
}

/**
 * Quality and speed, in a menu drawn inside the player rather than in a
 * portal, so it stays visible in fullscreen.
 */
export function PlayerSettingsMenu({
  qualities,
  selectedLevel,
  playingHeight,
  onSelectLevel,
  playbackRate,
  onSelectRate,
  onOpenChange,
}: PlayerSettingsMenuProps) {
  const { t } = useTranslation()
  const menuRef = useRef<HTMLDivElement>(null)
  const [view, setView] = useState<PlayerSettingsView | null>(null)
  const hasQualities = qualities.length > 1
  const autoLabel = playingHeight
    ? t("videos.player.quality_auto_playing", { height: playingHeight })
    : t("videos.player.quality_auto")
  const qualityLabel =
    selectedLevel === AUTO_QUALITY_LEVEL
      ? autoLabel
      : `${qualities.find(({ level }) => level === selectedLevel)?.height}p`
  const rateLabel = (rate: number) =>
    rate === 1 ? t("videos.player.speed_normal") : `${rate}×`

  const changeView = (next: PlayerSettingsView | null) => {
    setView(next)
    onOpenChange(next !== null)
  }

  useHotkey("Escape", () => changeView(null), {
    target: menuRef,
    enabled: view !== null,
    capture: true,
  })

  useEffect(() => {
    if (!view) return

    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setView(null)
        onOpenChange(false)
      }
    }

    document.addEventListener("pointerdown", closeOnOutsidePointer)

    return () =>
      document.removeEventListener("pointerdown", closeOnOutsidePointer)
  }, [view, onOpenChange])

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        className="flex size-9 items-center justify-center rounded-md text-white hover:bg-white/15 focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none"
        aria-label={t("videos.player.settings")}
        aria-expanded={view !== null}
        onClick={() => changeView(view ? null : PLAYER_SETTINGS_VIEWS.MAIN)}
      >
        <SettingsIcon
          className={cn("size-5 transition-transform", view && "rotate-45")}
        />
      </button>
      {view && (
        <div className="absolute right-0 bottom-full mb-2 w-56 rounded-lg bg-black/85 p-1 text-sm text-white shadow-lg backdrop-blur">
          {match(view)
            .with(PLAYER_SETTINGS_VIEWS.MAIN, () => (
              <>
                {hasQualities && (
                  <PlayerMenuItem
                    onClick={() => changeView(PLAYER_SETTINGS_VIEWS.QUALITY)}
                  >
                    <span className="flex-1">{t("videos.player.quality")}</span>
                    <span className="text-white/70">{qualityLabel}</span>
                    <ChevronRightIcon className="size-4 text-white/70" />
                  </PlayerMenuItem>
                )}
                <PlayerMenuItem
                  onClick={() => changeView(PLAYER_SETTINGS_VIEWS.SPEED)}
                >
                  <span className="flex-1">{t("videos.player.speed")}</span>
                  <span className="text-white/70">
                    {rateLabel(playbackRate)}
                  </span>
                  <ChevronRightIcon className="size-4 text-white/70" />
                </PlayerMenuItem>
              </>
            ))
            .with(PLAYER_SETTINGS_VIEWS.QUALITY, () => (
              <SettingsOptions
                title={t("videos.player.quality")}
                onBack={() => changeView(PLAYER_SETTINGS_VIEWS.MAIN)}
                options={[
                  { value: AUTO_QUALITY_LEVEL, label: autoLabel },
                  ...qualities.map(({ level, height }) => ({
                    value: level,
                    label: `${height}p`,
                  })),
                ]}
                selectedValue={selectedLevel}
                onSelect={(level) => {
                  onSelectLevel(level)
                  changeView(null)
                }}
              />
            ))
            .with(PLAYER_SETTINGS_VIEWS.SPEED, () => (
              <SettingsOptions
                title={t("videos.player.speed")}
                onBack={() => changeView(PLAYER_SETTINGS_VIEWS.MAIN)}
                options={PLAYBACK_RATES.map((rate) => ({
                  value: rate,
                  label: rateLabel(rate),
                }))}
                selectedValue={playbackRate}
                onSelect={(rate) => {
                  onSelectRate(rate)
                  changeView(null)
                }}
              />
            ))
            .exhaustive()}
        </div>
      )}
    </div>
  )
}

type SettingsOptionsProps = {
  title: string
  onBack: () => void
  options: { value: number; label: string }[]
  selectedValue: number
  onSelect: (value: number) => void
}

function SettingsOptions({
  title,
  onBack,
  options,
  selectedValue,
  onSelect,
}: SettingsOptionsProps) {
  return (
    <>
      <PlayerMenuItem
        className="mb-1 border-b border-white/10 font-medium"
        onClick={onBack}
      >
        <ChevronLeftIcon className="size-4" />
        {title}
      </PlayerMenuItem>
      <div role="radiogroup" aria-label={title}>
        {options.map(({ value, label }) => (
          <PlayerMenuItem
            key={value}
            role="radio"
            aria-checked={value === selectedValue}
            onClick={() => onSelect(value)}
          >
            <CheckIcon
              className={cn(
                "size-4",
                value === selectedValue ? "opacity-100" : "opacity-0"
              )}
            />
            {label}
          </PlayerMenuItem>
        ))}
      </div>
    </>
  )
}

type PlayerMenuItemProps = ComponentProps<"button">

function PlayerMenuItem({ className, ...props }: PlayerMenuItemProps) {
  return (
    <button
      type="button"
      className={cn(
        "flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left hover:bg-white/10 focus-visible:bg-white/10 focus-visible:outline-none",
        className
      )}
      {...props}
    />
  )
}
