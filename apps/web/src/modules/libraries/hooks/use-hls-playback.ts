import Hls from "hls.js"
import { useCallback, useEffect, useRef, useState } from "react"

import { AUTO_QUALITY_LEVEL } from "../libraries.constants"

import type { RefObject } from "react"
import type { VideoPlayerQuality } from "../libraries.types"

/**
 * Attaches an HLS stream to the `<video>` with hls.js, which also offers the
 * qualities to choose from; where hls.js cannot run, the browser plays the
 * stream itself. A new `src` plays in the same `<video>`, e.g. the next video
 * of a playlist, so fullscreen and volume carry over; with `autoPlay` it
 * starts as soon as it loads.
 */
export function useHlsPlayback(
  videoRef: RefObject<HTMLVideoElement | null>,
  src: string,
  {
    startSeconds,
    sendsCredentials = true,
    autoPlay = false,
  }: {
    startSeconds?: number
    sendsCredentials?: boolean
    autoPlay?: boolean
  } = {}
) {
  const hlsRef = useRef<Hls | null>(null)
  const [qualities, setQualities] = useState<VideoPlayerQuality[]>([])
  const [selectedLevel, setSelectedLevel] = useState(AUTO_QUALITY_LEVEL)
  const [playingLevel, setPlayingLevel] = useState(AUTO_QUALITY_LEVEL)
  const [hasFailed, setHasFailed] = useState(false)

  useEffect(() => {
    const video = videoRef.current

    if (!video) return

    setHasFailed(false)
    setQualities([])

    if (!Hls.isSupported()) {
      const seekToStart = () => {
        if (startSeconds) video.currentTime = startSeconds
      }

      video.addEventListener("loadedmetadata", seekToStart, { once: true })
      video.src = src

      return () => video.removeEventListener("loadedmetadata", seekToStart)
    }

    const hls = new Hls({
      startPosition: startSeconds ?? -1,
      xhrSetup: (xhr) => {
        xhr.withCredentials = sendsCredentials
      },
    })

    hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
      setQualities(
        data.levels
          .map((level, index) => ({ level: index, height: level.height }))
          .sort((left, right) => right.height - left.height)
      )

      if (autoPlay) video.play().catch(() => {})
    })
    hls.on(Hls.Events.LEVEL_SWITCHED, (_, data) => setPlayingLevel(data.level))
    hls.on(Hls.Events.ERROR, (_, data) => {
      if (data.fatal) setHasFailed(true)
    })
    hls.loadSource(src)
    hls.attachMedia(video)
    hlsRef.current = hls

    return () => {
      hls.destroy()
      hlsRef.current = null
    }
  }, [videoRef, src, startSeconds, sendsCredentials, autoPlay])

  const selectLevel = useCallback((level: number) => {
    setSelectedLevel(level)

    if (hlsRef.current) hlsRef.current.currentLevel = level
  }, [])

  return {
    qualities,
    selectedLevel,
    playingHeight: qualities.find(({ level }) => level === playingLevel)
      ?.height,
    selectLevel,
    hasFailed,
  }
}
