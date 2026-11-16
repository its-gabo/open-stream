import { useEffect, useState } from "react"

import { PLAYER_MEDIA_EVENTS } from "../libraries.constants"
import { readMediaState } from "../libraries.utils"

import type { RefObject } from "react"
import type { PlayerMediaState } from "../libraries.types"

/** The `<video>`'s state for the controls, kept up to date from its events. */
export function useMediaState(videoRef: RefObject<HTMLVideoElement | null>) {
  const [state, setState] = useState<PlayerMediaState | null>(null)

  useEffect(() => {
    const video = videoRef.current

    if (!video) return

    const update = () => setState(readMediaState(video))

    PLAYER_MEDIA_EVENTS.forEach((event) =>
      video.addEventListener(event, update)
    )
    update()

    return () =>
      PLAYER_MEDIA_EVENTS.forEach((event) =>
        video.removeEventListener(event, update)
      )
  }, [videoRef])

  return state
}
