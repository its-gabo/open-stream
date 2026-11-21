import { PLAYBACK_HOST_PATTERN } from "@workspace/shared"
import { useEffect, useState } from "react"

import { VIEW_REPORT_MAX_STEP_SECONDS } from "../libraries.constants"
import { postViewReport, toViewUrl } from "../libraries.utils"

import type { RefObject } from "react"
import type { VideoView, VideoViewProgressBody } from "@/api/generated-api"

/** The host of the page framing the player, when it is framed and says so. */
function readEmbeddingHost() {
  if (window.top === window || !document.referrer) return null

  const host = URL.parse(document.referrer)?.host ?? null

  return host && PLAYBACK_HOST_PATTERN.test(host) ? host : null
}

/**
 * Follows what a viewer actually played: the seconds played and the furthest
 * point reached. A jump of the position longer than a step of normal
 * playback is a seek, so skipping ahead counts towards neither.
 */
function createPlaybackTracker(video: HTMLVideoElement) {
  let lastTime = video.currentTime
  let watchedSeconds = 0
  let furthestSeconds = 0
  let reportedFurthestSeconds = 0

  return {
    countStep() {
      const step = video.currentTime - lastTime

      if (!video.paused && step > 0 && step < VIEW_REPORT_MAX_STEP_SECONDS) {
        watchedSeconds += step
        furthestSeconds = Math.max(furthestSeconds, video.currentTime)
      }

      lastTime = video.currentTime
    },
    skipStep() {
      lastTime = video.currentTime
    },
    reachEnd() {
      if (Number.isFinite(video.duration)) furthestSeconds = video.duration
    },
    takeProgress(): VideoViewProgressBody | null {
      if (watchedSeconds <= 0 && furthestSeconds <= reportedFurthestSeconds) {
        return null
      }

      const progress = { watchedSeconds, positionSeconds: furthestSeconds }

      watchedSeconds = 0
      reportedFurthestSeconds = furthestSeconds

      return progress
    },
    reset() {
      watchedSeconds = 0
      furthestSeconds = 0
      reportedFurthestSeconds = 0
    },
  }
}

/** One view on the API: started when playback starts, then reported to until it finishes. */
function createViewSession(
  viewsUrl: string,
  tracker: ReturnType<typeof createPlaybackTracker>,
  onStarted: (viewId: string) => void
) {
  let view: VideoView | null = null
  let starting: AbortController | null = null
  let reportTimer: ReturnType<typeof setInterval> | undefined

  const report = () => {
    const progress = view && tracker.takeProgress()

    if (!view || !progress) return

    void postViewReport(
      toViewUrl(viewsUrl, view.id, "progress"),
      progress
    ).catch(() => {})
  }

  const start = async () => {
    if (view || starting) return

    const controller = new AbortController()

    starting = controller

    try {
      const response = await postViewReport(
        viewsUrl,
        { embeddingHost: readEmbeddingHost() },
        controller.signal
      )

      if (!response.ok) return

      view = (await response.json()).data.view as VideoView
      onStarted(view.id)
      reportTimer = setInterval(report, view.reportIntervalSeconds * 1000)
    } catch {
      // Counting is best effort, and a view finished while starting is aborted.
    } finally {
      if (starting === controller) starting = null
    }
  }

  /** Sends what is left; playing again starts a new view. */
  const finish = () => {
    report()
    starting?.abort()
    clearInterval(reportTimer)
    starting = null
    view = null
    tracker.reset()
  }

  return { start, report, finish }
}

/**
 * Counts views of the video at `viewsUrl`: one starts when playback starts,
 * then its progress is reported regularly, when playback pauses and when the
 * page is hidden or left. A view finishes at the end of the video, so a
 * replay counts again. Does nothing without `viewsUrl`.
 *
 * Returns the id of the latest view, which stays after it finishes, e.g. for
 * what the viewer does on the end screen; null until one starts.
 */
export function useViewReporting(
  videoRef: RefObject<HTMLVideoElement | null>,
  viewsUrl: string | undefined
) {
  const [latestView, setLatestView] = useState<{
    viewsUrl: string
    id: string
  } | null>(null)

  useEffect(() => {
    const video = videoRef.current

    if (!video || !viewsUrl) return

    const tracker = createPlaybackTracker(video)
    const session = createViewSession(viewsUrl, tracker, (id) =>
      setLatestView({ viewsUrl, id })
    )
    const finishAtEnd = () => {
      tracker.reachEnd()
      session.finish()
    }
    const reportWhenHidden = () => {
      if (document.visibilityState === "hidden") session.report()
    }
    const videoListeners = {
      playing: session.start,
      timeupdate: tracker.countStep,
      seeked: tracker.skipStep,
      pause: session.report,
      ended: finishAtEnd,
    }

    for (const [event, listener] of Object.entries(videoListeners)) {
      video.addEventListener(event, listener)
    }
    document.addEventListener("visibilitychange", reportWhenHidden)
    window.addEventListener("pagehide", session.report)

    return () => {
      session.finish()
      for (const [event, listener] of Object.entries(videoListeners)) {
        video.removeEventListener(event, listener)
      }
      document.removeEventListener("visibilitychange", reportWhenHidden)
      window.removeEventListener("pagehide", session.report)
    }
  }, [videoRef, viewsUrl])

  // A view of another video, e.g. the previous one of a playlist, is not this one's.
  return latestView && latestView.viewsUrl === viewsUrl ? latestView.id : null
}
