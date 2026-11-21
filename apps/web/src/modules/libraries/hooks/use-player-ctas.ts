import { VIDEO_CTA_PLACEMENTS, VIDEO_CTA_TIMINGS } from "@workspace/shared"
import { useEffect, useState } from "react"

import type { VideoEmbedCta } from "@/api/generated-api"

type PlayerCtasState = {
  /** The source the state belongs to; another video starts afresh. */
  src: string
  closedIds: string[]
}

/** When each random overlay of the source shows this time, by id. */
type RandomStartsState = { src: string; startsById: Record<string, number> }

/** Where an overlay shows: its own times, or, for a random one, the moment picked for it. */
const toShowWindow = (
  cta: VideoEmbedCta,
  randomStarts: Record<string, number>
) => {
  if (cta.timing !== VIDEO_CTA_TIMINGS.RANDOM) {
    return {
      start: cta.startSeconds ?? 0,
      end: cta.endSeconds ?? Number.POSITIVE_INFINITY,
    }
  }

  if (!(cta.id in randomStarts)) return null

  const start = randomStarts[cta.id]

  return { start, end: start + (cta.durationSeconds ?? 0) }
}

/**
 * Which of a video's calls to action show at the player's position: the
 * first overlay whose time has come, and the end screen once the video ended.
 * A random overlay gets its moment once per source, so seeking back finds it
 * where it was. A call to action stays away once closed, and each one shown
 * is reported.
 */
export function usePlayerCtas({
  src,
  ctas,
  currentSeconds,
  hasStarted,
  isEnded,
  onShown,
}: {
  src: string
  ctas: VideoEmbedCta[]
  currentSeconds: number
  hasStarted: boolean
  isEnded: boolean
  onShown: (ctaId: string) => void
}) {
  const [state, setState] = useState<PlayerCtasState>({ src, closedIds: [] })
  const [randomStartsState, setRandomStartsState] = useState<RandomStartsState>(
    { src, startsById: {} }
  )
  const closedIds = state.src === src ? state.closedIds : []
  const randomStarts =
    randomStartsState.src === src ? randomStartsState.startsById : {}
  const isOpen = (cta: VideoEmbedCta) => !closedIds.includes(cta.id)
  const isShowing = (cta: VideoEmbedCta) => {
    const showWindow = toShowWindow(cta, randomStarts)

    return (
      showWindow !== null &&
      showWindow.start <= currentSeconds &&
      currentSeconds < showWindow.end
    )
  }
  const overlay =
    hasStarted && !isEnded
      ? ctas.find(
          (cta) =>
            cta.placement === VIDEO_CTA_PLACEMENTS.OVERLAY &&
            isOpen(cta) &&
            isShowing(cta)
        )
      : undefined
  const endScreen = isEnded
    ? ctas.find(
        (cta) =>
          cta.placement === VIDEO_CTA_PLACEMENTS.END_SCREEN && isOpen(cta)
      )
    : undefined
  const overlayId = overlay?.id
  const endScreenId = endScreen?.id

  useEffect(() => {
    setRandomStartsState((current) => {
      const startsById = current.src === src ? current.startsById : {}
      const missing = ctas.filter(
        (cta) =>
          cta.timing === VIDEO_CTA_TIMINGS.RANDOM && !(cta.id in startsById)
      )

      if (current.src === src && missing.length === 0) return current

      return {
        src,
        startsById: {
          ...startsById,
          ...Object.fromEntries(
            missing.map((cta) => {
              const start = cta.startSeconds ?? 0
              const latestStart =
                (cta.endSeconds ?? start) - (cta.durationSeconds ?? 0)

              return [
                cta.id,
                start + Math.random() * Math.max(0, latestStart - start),
              ]
            })
          ),
        },
      }
    })
  }, [src, ctas])

  useEffect(() => {
    if (overlayId) onShown(overlayId)
  }, [overlayId, onShown])

  useEffect(() => {
    if (endScreenId) onShown(endScreenId)
  }, [endScreenId, onShown])

  const close = (ctaId: string) =>
    setState((current) => ({
      src,
      closedIds: [...(current.src === src ? current.closedIds : []), ctaId],
    }))

  return { overlay, endScreen, close }
}
