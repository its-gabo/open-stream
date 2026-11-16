import { useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"

import { LOCAL_UPLOAD_STATUSES } from "../libraries.constants"
import { useVideoUploadStore } from "../video-upload.store"
import { VideoUploadsList } from "./video-uploads-list"

import type { LocalVideoUpload } from "../libraries.types"

import {
  TOASTER_BOTTOM_INSET_VARIABLE,
  TOASTER_GAP_PX,
} from "@/lib/toaster.constants"

type VideoUploadsPanelProps = {
  organizationSlug: string
}

/**
 * Uploads of this tab on every page of the organization. It sits in the toast
 * corner with the toasts' look and slide-in, and lifts the toasts above
 * itself. Leaving the page while an upload runs asks first.
 */
export function VideoUploadsPanel({
  organizationSlug,
}: VideoUploadsPanelProps) {
  const { t } = useTranslation()
  const panelRef = useRef<HTMLElement>(null)
  const allUploads = useVideoUploadStore((state) => state.uploads)
  const uploads = useMemo(
    () =>
      Object.values(allUploads).filter(
        (upload): upload is LocalVideoUpload =>
          upload?.organizationSlug === organizationSlug
      ),
    [allUploads, organizationSlug]
  )
  const hasRunningUpload = Object.values(allUploads).some(
    (upload) => upload?.status === LOCAL_UPLOAD_STATUSES.UPLOADING
  )
  const isOpen = uploads.length > 0
  // The last uploads stay on screen while the panel slides out.
  const [shownUploads, setShownUploads] = useState(uploads)
  const [isRendered, setIsRendered] = useState(isOpen)
  const [isEntered, setIsEntered] = useState(false)

  useEffect(() => {
    if (isOpen) setShownUploads(uploads)
  }, [isOpen, uploads])

  useEffect(() => {
    if (!isOpen) {
      setIsEntered(false)
      return
    }

    setIsRendered(true)

    // Two frames, so the hidden position is painted before it transitions in.
    let frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => setIsEntered(true))
    })

    return () => cancelAnimationFrame(frame)
  }, [isOpen])

  useEffect(() => {
    const panel = panelRef.current
    const rootStyle = document.documentElement.style

    if (!isEntered || !panel) {
      rootStyle.removeProperty(TOASTER_BOTTOM_INSET_VARIABLE)
      return
    }

    const observer = new ResizeObserver(() =>
      rootStyle.setProperty(
        TOASTER_BOTTOM_INSET_VARIABLE,
        `${panel.offsetHeight + TOASTER_GAP_PX}px`
      )
    )

    observer.observe(panel)

    return () => {
      observer.disconnect()
      rootStyle.removeProperty(TOASTER_BOTTOM_INSET_VARIABLE)
    }
  }, [isEntered])

  useEffect(() => {
    if (!hasRunningUpload) return

    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
    }

    window.addEventListener("beforeunload", warnBeforeUnload)

    return () => window.removeEventListener("beforeunload", warnBeforeUnload)
  }, [hasRunningUpload])

  if (!isRendered) return null

  return (
    <aside
      ref={panelRef}
      aria-label={t("videos.uploads_panel.title")}
      data-entered={isEntered || undefined}
      onTransitionEnd={(event) => {
        if (event.target === event.currentTarget && !isEntered) {
          setIsRendered(false)
        }
      }}
      className="fixed right-4 bottom-4 left-4 z-40 translate-y-full overflow-hidden rounded-lg border bg-popover text-sm text-popover-foreground opacity-0 shadow-[0_4px_12px_rgb(0_0_0/0.1)] transition-[translate,opacity] duration-400 data-entered:translate-y-0 data-entered:opacity-100 min-[600px]:right-6 min-[600px]:bottom-6 min-[600px]:left-auto min-[600px]:w-[356px]"
    >
      <VideoUploadsList uploads={shownUploads} />
    </aside>
  )
}
