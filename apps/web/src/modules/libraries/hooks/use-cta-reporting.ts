import { useCallback, useEffect, useRef } from "react"

import { postViewReport, toViewUrl } from "../libraries.utils"

import type { VideoCtaEventBody, VideoCtaLeadBody } from "@/api/generated-api"

type CtaEvent = { ctaId: string; type: VideoCtaEventBody["type"] }

/**
 * Tells the API what the viewer does with calls to action, as part of the
 * view at `viewsUrl` with id `viewId`. Each event goes once per view; those
 * before the view has started wait for it. Without `viewsUrl`, e.g. in the
 * dashboard's preview, nothing is sent and no lead can be left.
 */
export function useCtaReporting(
  viewsUrl: string | undefined,
  viewId: string | null
) {
  const pendingEventsRef = useRef<CtaEvent[]>([])
  const sentEventKeysRef = useRef(new Set<string>())

  const sendEvent = useCallback(
    (toViewId: string, { ctaId, type }: CtaEvent) => {
      const key = `${toViewId}:${ctaId}:${type}`

      if (!viewsUrl || sentEventKeysRef.current.has(key)) return

      sentEventKeysRef.current.add(key)
      // Counting is best effort, like the view's own reports.
      void postViewReport(
        toViewUrl(viewsUrl, toViewId, `ctas/${ctaId}/events`),
        { type }
      ).catch(() => {})
    },
    [viewsUrl]
  )

  useEffect(() => {
    if (!viewId) return

    const pending = pendingEventsRef.current

    pendingEventsRef.current = []
    for (const event of pending) sendEvent(viewId, event)
  }, [viewId, sendEvent])

  const reportCtaEvent = useCallback(
    (event: CtaEvent) => {
      if (!viewsUrl) return

      if (viewId) sendEvent(viewId, event)
      else pendingEventsRef.current.push(event)
    },
    [viewsUrl, viewId, sendEvent]
  )

  /** Leaves an email address in a form; true once the API took it. */
  const submitLead = useCallback(
    async (ctaId: string, body: VideoCtaLeadBody) => {
      if (!viewsUrl || !viewId) return false

      try {
        const response = await postViewReport(
          toViewUrl(viewsUrl, viewId, `ctas/${ctaId}/leads`),
          body
        )

        return response.ok
      } catch {
        return false
      }
    },
    [viewsUrl, viewId]
  )

  return {
    reportCtaEvent,
    /** Null where leads cannot be left, e.g. in the dashboard's preview. */
    submitLead: viewsUrl ? submitLead : null,
  }
}
