import Hls from "hls.js"
import { useCallback, useEffect, useRef, useState } from "react"

import { AUTO_QUALITY_LEVEL } from "../libraries.constants"

import type { RefObject } from "react"
import type { VideoPlayerQuality } from "../libraries.types"

/**
 * Attaches an HLS stream to the `<video>` with hls.js, which also offers the
 * qualities to choose from; where hls.js cannot run, the browser plays the
 * stream itself.
 */
export function useHlsPlayback(
  videoRef: RefObject<HTMLVideoElement | null>,
  src: string
) {
  const hlsRef = useRef<Hls | null>(null)
  const [qualities, setQualities] = useState<VideoPlayerQuality[]>([])
  const [selectedLevel, setSelectedLevel] = useState(AUTO_QUALITY_LEVEL)
  const [playingLevel, setPlayingLevel] = useState(AUTO_QUALITY_LEVEL)
  const [hasFailed, setHasFailed] = useState(false)

  useEffect(() => {
    const video = videoRef.current

    if (!video) return

    if (!Hls.isSupported()) {
      video.src = src

      return
    }

    const hls = new Hls({
      xhrSetup: (xhr) => {
        xhr.withCredentials = true
      },
    })

    hls.on(Hls.Events.MANIFEST_PARSED, (_, data) =>
      setQualities(
        data.levels
          .map((level, index) => ({ level: index, height: level.height }))
          .sort((left, right) => right.height - left.height)
      )
    )
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
  }, [videoRef, src])

  const selectLevel = useCallback((level: number) => {
    setSelectedLevel(level)

    if (hlsRef.current) hlsRef.current.currentLevel = level
  }, [])

  return {
    qualities,
    selectedLevel,
    /** The quality on screen, also while the choice is automatic. */
    playingHeight: qualities.find(({ level }) => level === playingLevel)
      ?.height,
    selectLevel,
    hasFailed,
  }
}
