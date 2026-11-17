import { cn } from "@workspace/ui/lib/utils"
import { useHotkeys } from "@tanstack/react-hotkeys"
import Hls from "hls.js"
import {
  CircleAlertIcon,
  LoaderCircleIcon,
  MaximizeIcon,
  MinimizeIcon,
  PauseIcon,
  PictureInPicture2Icon,
  PlayIcon,
  Volume1Icon,
  Volume2Icon,
  VolumeXIcon,
} from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { P, match } from "ts-pattern"

import { useHlsPlayback } from "../hooks/use-hls-playback"
import { useMediaState } from "../hooks/use-media-state"
import { useStoryboard } from "../hooks/use-storyboard"
import { useViewReporting } from "../hooks/use-view-reporting"
import {
  PLAYER_CONTROLS_HIDE_DELAY_MS,
  PLAYER_SEEK_STEP_SECONDS,
  PLAYER_VOLUME_STEP,
} from "../libraries.constants"
import {
  canPlayHlsNatively,
  findStoryboardCue,
  formatPlaybackTime,
} from "../libraries.utils"
import { PlayerButton } from "./player-button"
import { PlayerSettingsMenu } from "./player-settings-menu"
import { PlayerSlider } from "./player-slider"

type VideoPlayerProps = {
  /** The HLS master playlist. */
  src: string
  poster: string
  /** The storyboard WebVTT, for previews over the seek bar. */
  storyboardUrl: string
  /** Shown over the top of the video while the controls are. */
  title?: string
  autoPlay?: boolean
  /** Starts muted; browsers only autoplay muted video. */
  muted?: boolean
  loop?: boolean
  startSeconds?: number
  /** Fills its container edge to edge instead of a rounded 16:9 box, e.g. in an embed. */
  fill?: boolean
  /** Sends the session cookie with each file request; the public library API needs none. */
  sendsCredentials?: boolean
  /** Takes the keyboard focus when it appears, for the shortcuts. */
  autoFocus?: boolean
  /** Where to count views of this video; views are not counted without it. */
  viewsUrl?: string
}

/**
 * Plays an HLS video with hls.js and the app's own controls: seeking with
 * storyboard previews, volume, quality and speed, picture-in-picture,
 * fullscreen and keyboard shortcuts. Where hls.js cannot run, e.g. on older
 * iPhones, the browser plays the stream with its own controls.
 */
export function VideoPlayer({
  src,
  poster,
  storyboardUrl,
  title,
  autoPlay = false,
  muted = false,
  loop = false,
  startSeconds,
  fill = false,
  sendsCredentials = true,
  autoFocus = true,
  viewsUrl,
}: VideoPlayerProps) {
  const { t } = useTranslation()
  const containerRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const playback = useHlsPlayback(videoRef, src, {
    startSeconds,
    sendsCredentials,
  })
  const media = useMediaState(videoRef)
  useViewReporting(videoRef, viewsUrl)
  const storyboard = useStoryboard(storyboardUrl, { sendsCredentials })
  const [usesOwnControls] = useState(() => Hls.isSupported())
  const [isSupported] = useState(
    () => Hls.isSupported() || canPlayHlsNatively()
  )
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isIdle, setIsIdle] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [previewSeconds, setPreviewSeconds] = useState<number | null>(null)
  const isPlaying = media?.isPlaying ?? false
  const duration = media?.duration ?? 0
  const areControlsVisible = !isPlaying || !isIdle || isSettingsOpen

  useEffect(() => {
    if (!autoFocus) return

    const frame = requestAnimationFrame(() =>
      containerRef.current?.focus({ preventScroll: true })
    )

    return () => cancelAnimationFrame(frame)
  }, [autoFocus])

  useEffect(() => {
    const updateFullscreen = () =>
      setIsFullscreen(document.fullscreenElement === containerRef.current)

    document.addEventListener("fullscreenchange", updateFullscreen)

    return () =>
      document.removeEventListener("fullscreenchange", updateFullscreen)
  }, [])

  useEffect(() => {
    if (!isPlaying || isIdle) return

    const timer = setTimeout(
      () => setIsIdle(true),
      PLAYER_CONTROLS_HIDE_DELAY_MS
    )

    return () => clearTimeout(timer)
  }, [isPlaying, isIdle])

  const withVideo = (action: (video: HTMLVideoElement) => void) => {
    if (videoRef.current) action(videoRef.current)
  }

  const togglePlay = () =>
    withVideo((video) => {
      if (video.paused || video.ended) void video.play()
      else video.pause()
    })

  const seekTo = (seconds: number) =>
    withVideo((video) => {
      video.currentTime = Math.min(Math.max(0, seconds), duration)
    })

  const changeVolume = (volume: number) =>
    withVideo((video) => {
      video.volume = Math.min(1, Math.max(0, volume))
      video.muted = volume <= 0
    })

  const toggleMute = () =>
    withVideo((video) => {
      video.muted = !video.muted

      if (!video.muted && video.volume === 0) video.volume = 1
    })

  const toggleFullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen()
    else void containerRef.current?.requestFullscreen()
  }

  const togglePictureInPicture = () =>
    withVideo((video) => {
      if (document.pictureInPictureElement) {
        void document.exitPictureInPicture()
      } else {
        void video.requestPictureInPicture()
      }
    })

  const handleSettingsOpenChange = useCallback(
    (isOpen: boolean) => setIsSettingsOpen(isOpen),
    []
  )

  useHotkeys(
    [
      { hotkey: "Space", callback: togglePlay },
      { hotkey: "K", callback: togglePlay },
      {
        hotkey: "ArrowLeft",
        callback: () =>
          seekTo((media?.currentTime ?? 0) - PLAYER_SEEK_STEP_SECONDS),
      },
      {
        hotkey: "ArrowRight",
        callback: () =>
          seekTo((media?.currentTime ?? 0) + PLAYER_SEEK_STEP_SECONDS),
      },
      {
        hotkey: "ArrowUp",
        callback: () => changeVolume((media?.volume ?? 1) + PLAYER_VOLUME_STEP),
      },
      {
        hotkey: "ArrowDown",
        callback: () => changeVolume((media?.volume ?? 1) - PLAYER_VOLUME_STEP),
      },
      { hotkey: "M", callback: toggleMute },
      { hotkey: "F", callback: toggleFullscreen },
    ],
    { target: containerRef, enabled: usesOwnControls, capture: true }
  )

  if (!isSupported || playback.hasFailed) {
    return (
      <div
        className={cn(
          "flex w-full flex-col items-center justify-center gap-2 bg-muted p-6 text-center text-sm text-muted-foreground",
          fill ? "h-full" : "aspect-video rounded-lg"
        )}
      >
        <CircleAlertIcon className="size-5" />
        {isSupported
          ? t("videos.player.failed")
          : t("videos.player.unsupported")}
      </div>
    )
  }

  if (!usesOwnControls) {
    return (
      <video
        ref={videoRef}
        className={cn(
          "w-full bg-black",
          fill ? "h-full" : "aspect-video rounded-lg"
        )}
        poster={poster}
        controls
        playsInline
        preload="metadata"
        autoPlay={autoPlay}
        muted={muted}
        loop={loop}
      />
    )
  }

  const previewCue =
    previewSeconds !== null
      ? findStoryboardCue(storyboard, previewSeconds)
      : undefined
  const VolumeIcon = match(media)
    .with({ isMuted: true }, () => VolumeXIcon)
    .with({ volume: P.number.lt(0.5) }, () => Volume1Icon)
    .otherwise(() => Volume2Icon)

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      aria-label={t("videos.player.label")}
      className={cn(
        "group/player relative w-full overflow-hidden bg-black outline-none",
        fill ? "h-full" : "aspect-video rounded-lg",
        isFullscreen && "rounded-none",
        !areControlsVisible && "cursor-none"
      )}
      onPointerMove={() => setIsIdle(false)}
      onPointerLeave={() => {
        if (isPlaying) setIsIdle(true)
      }}
    >
      <video
        ref={videoRef}
        className="size-full object-contain"
        poster={poster}
        playsInline
        preload="metadata"
        autoPlay={autoPlay}
        muted={muted}
        loop={loop}
        onClick={togglePlay}
        onDoubleClick={toggleFullscreen}
      />

      {title && (
        <div
          className={cn(
            "pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-black/70 to-transparent px-4 pt-3 pb-8 transition-opacity duration-200",
            areControlsVisible ? "opacity-100" : "opacity-0"
          )}
        >
          <p className="truncate text-sm font-medium text-white">{title}</p>
        </div>
      )}

      {media?.isWaiting && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <LoaderCircleIcon className="size-10 animate-spin text-white/90" />
        </div>
      )}

      {!media?.hasStarted && (
        <button
          type="button"
          className="absolute inset-0 m-auto flex size-16 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur transition hover:scale-105 hover:bg-black/75 focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none"
          aria-label={t("videos.player.play")}
          onClick={() => {
            togglePlay()
            containerRef.current?.focus({ preventScroll: true })
          }}
        >
          <PlayIcon className="ml-1 size-7 fill-current" />
        </button>
      )}

      <div
        className={cn(
          "absolute inset-x-0 bottom-0 flex flex-col gap-1 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-3 pt-10 pb-2 transition-opacity duration-200",
          areControlsVisible ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      >
        <PlayerSlider
          label={t("videos.player.seek")}
          value={duration ? (media?.currentTime ?? 0) / duration : 0}
          valueText={`${formatPlaybackTime(media?.currentTime ?? 0)} / ${formatPlaybackTime(duration)}`}
          secondaryValue={duration ? (media?.bufferedEnd ?? 0) / duration : 0}
          keyboardStep={duration ? PLAYER_SEEK_STEP_SECONDS / duration : 0}
          onChange={(fraction) => seekTo(fraction * duration)}
          onHoverChange={(fraction) =>
            setPreviewSeconds(fraction === null ? null : fraction * duration)
          }
          hoverContentHalfWidth={(previewCue?.width ?? 0) / 2}
          hoverContent={
            previewSeconds !== null && (
              <div className="flex flex-col items-center gap-1">
                {previewCue && (
                  <div
                    className="rounded-md border border-white/20 bg-black bg-no-repeat shadow-lg"
                    style={{
                      width: previewCue.width,
                      height: previewCue.height,
                      backgroundImage: `url("${previewCue.imageUrl}")`,
                      backgroundPosition: `-${previewCue.x}px -${previewCue.y}px`,
                    }}
                  />
                )}
                <span className="rounded bg-black/80 px-1.5 py-0.5 text-xs font-medium text-white tabular-nums">
                  {formatPlaybackTime(previewSeconds)}
                </span>
              </div>
            )
          }
        />
        <div className="flex items-center gap-1 text-white">
          <PlayerButton
            label={
              isPlaying ? t("videos.player.pause") : t("videos.player.play")
            }
            onClick={togglePlay}
          >
            {isPlaying ? (
              <PauseIcon className="fill-current" />
            ) : (
              <PlayIcon className="fill-current" />
            )}
          </PlayerButton>
          <div className="group/volume flex items-center">
            <PlayerButton
              label={
                media?.isMuted
                  ? t("videos.player.unmute")
                  : t("videos.player.mute")
              }
              onClick={toggleMute}
            >
              <VolumeIcon />
            </PlayerButton>
            <PlayerSlider
              className="w-0 opacity-0 transition-all duration-200 group-focus-within/volume:ml-1 group-focus-within/volume:w-20 group-focus-within/volume:opacity-100 group-hover/volume:ml-1 group-hover/volume:w-20 group-hover/volume:opacity-100"
              label={t("videos.player.volume")}
              value={media?.isMuted ? 0 : (media?.volume ?? 1)}
              valueText={`${Math.round((media?.isMuted ? 0 : (media?.volume ?? 1)) * 100)}%`}
              keyboardStep={PLAYER_VOLUME_STEP}
              onChange={changeVolume}
            />
          </div>
          <span className="ml-2 text-sm text-white/90 tabular-nums">
            {formatPlaybackTime(media?.currentTime ?? 0)}
            <span className="text-white/60">
              {" / "}
              {formatPlaybackTime(duration)}
            </span>
          </span>
          <div className="ml-auto flex items-center gap-1">
            <PlayerSettingsMenu
              qualities={playback.qualities}
              selectedLevel={playback.selectedLevel}
              playingHeight={playback.playingHeight}
              onSelectLevel={playback.selectLevel}
              playbackRate={media?.playbackRate ?? 1}
              onSelectRate={(rate) =>
                withVideo((video) => {
                  video.playbackRate = rate
                })
              }
              onOpenChange={handleSettingsOpenChange}
            />
            {document.pictureInPictureEnabled && (
              <PlayerButton
                label={t("videos.player.picture_in_picture")}
                onClick={togglePictureInPicture}
              >
                <PictureInPicture2Icon />
              </PlayerButton>
            )}
            <PlayerButton
              label={
                isFullscreen
                  ? t("videos.player.exit_fullscreen")
                  : t("videos.player.fullscreen")
              }
              onClick={toggleFullscreen}
            >
              {isFullscreen ? <MinimizeIcon /> : <MaximizeIcon />}
            </PlayerButton>
          </div>
        </div>
      </div>
    </div>
  )
}
