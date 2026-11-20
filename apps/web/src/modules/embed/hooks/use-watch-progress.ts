import { useCallback, useEffect, useRef, useState } from "react"
import { z } from "zod"

import {
  WATCHED_SHARE_FINISHED,
  WATCH_PROGRESS_SAVE_STEP_SECONDS,
  WATCH_PROGRESS_STORAGE_PREFIX,
} from "../embed.constants"

import type { WatchProgress } from "../embed.types"

const watchProgressSchema = z.object({
  positionSeconds: z.number().nonnegative(),
  durationSeconds: z.number().positive(),
})

/** Storage can be blocked, e.g. for third-party frames, so progress is best effort. */
function readStoredProgress(videoId: string): WatchProgress | null {
  try {
    const stored = localStorage.getItem(
      `${WATCH_PROGRESS_STORAGE_PREFIX}${videoId}`
    )
    const parsed = stored
      ? watchProgressSchema.safeParse(JSON.parse(stored))
      : null

    return parsed?.success ? parsed.data : null
  } catch {
    return null
  }
}

function storeProgress(videoId: string, progress: WatchProgress) {
  try {
    localStorage.setItem(
      `${WATCH_PROGRESS_STORAGE_PREFIX}${videoId}`,
      JSON.stringify(progress)
    )
  } catch {
    // Not kept; the viewer starts from the beginning next time.
  }
}

export const toWatchedShare = (progress: WatchProgress | undefined) =>
  progress
    ? Math.min(1, progress.positionSeconds / progress.durationSeconds)
    : 0

/** Where to start a video: where the viewer left it, or the start once they finished it. */
export const toResumeSeconds = (progress: WatchProgress | undefined) =>
  progress && toWatchedShare(progress) < WATCHED_SHARE_FINISHED
    ? progress.positionSeconds
    : undefined

/**
 * How far the viewer got in each of `videoIds`, kept in this browser since
 * views are anonymous. It is read once mounted, as the server cannot see it,
 * and saved as playback moves.
 */
export function useWatchProgress(videoIds: string[]) {
  const [progressById, setProgressById] = useState<
    Record<string, WatchProgress>
  >({})
  const savedSecondsRef = useRef<Partial<Record<string, number>>>({})
  const videoIdsKey = videoIds.join(",")

  useEffect(() => {
    setProgressById(
      Object.fromEntries(
        videoIdsKey.split(",").flatMap((videoId) => {
          const progress = videoId ? readStoredProgress(videoId) : null

          return progress ? [[videoId, progress]] : []
        })
      )
    )
  }, [videoIdsKey])

  /** Saves the position when it moved a step from the last save, or reached the end. */
  const recordProgress = useCallback(
    (videoId: string, positionSeconds: number, durationSeconds: number) => {
      if (durationSeconds <= 0) return

      const savedSeconds = savedSecondsRef.current[videoId]
      const reachedEnd = positionSeconds >= durationSeconds - 1

      if (
        savedSeconds !== undefined &&
        Math.abs(positionSeconds - savedSeconds) <
          WATCH_PROGRESS_SAVE_STEP_SECONDS &&
        !reachedEnd
      ) {
        return
      }

      const progress = { positionSeconds, durationSeconds }

      savedSecondsRef.current[videoId] = positionSeconds
      storeProgress(videoId, progress)
      setProgressById((current) => ({ ...current, [videoId]: progress }))
    },
    []
  )

  return { progressById, recordProgress }
}
