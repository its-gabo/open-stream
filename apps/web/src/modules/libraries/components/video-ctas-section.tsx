import {
  VIDEO_CTA_KINDS,
  VIDEO_CTA_LIMITS,
  VIDEO_CTA_PLACEMENTS,
  VIDEO_CTA_TIMINGS,
} from "@workspace/shared"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@workspace/ui/components/alert-dialog"
import { Button } from "@workspace/ui/components/button"
import { Skeleton } from "@workspace/ui/components/skeleton"
import {
  MailIcon,
  MousePointerClickIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { match } from "ts-pattern"

import { formatChapterTime } from "../libraries.utils"
import { VideoCtaDialog } from "./video-cta-dialog"

import type { Video, VideoCta } from "@/api/generated-api"
import { useVideoCtaDeleteMutation } from "@/api/mutations/libraries/useVideoCtaDeleteMutation"
import { useVideoCtasQuery } from "@/api/queries/libraries/useVideoCtasQuery"

type VideoCtasSectionProps = {
  organizationSlug: string
  libraryId: string
  /** A processed video. */
  video: Video
  /** Where the player above is, as the start of a new overlay. */
  currentSeconds: number
}

/** The dialog's state: closed, or open on a call to action, or on a new one while null. */
type DialogState = { cta: VideoCta | null; openedAt: number } | null

/**
 * A video's calls to action, in playback order: buttons and email forms
 * shown over the video at their times, or on its end screen. The player
 * above previews them.
 */
export function VideoCtasSection({
  organizationSlug,
  libraryId,
  video,
  currentSeconds,
}: VideoCtasSectionProps) {
  const { t } = useTranslation()
  const [dialog, setDialog] = useState<DialogState>(null)
  const [ctaToDelete, setCtaToDelete] = useState<VideoCta | null>(null)
  const { data: ctas, isPending } = useVideoCtasQuery(
    organizationSlug,
    libraryId,
    video.id
  )
  const { mutate: deleteCta, isPending: isDeletePending } =
    useVideoCtaDeleteMutation(organizationSlug, libraryId, video.id, {
      onSuccess: () => setCtaToDelete(null),
    })
  const isAtLimit = (ctas?.length ?? 0) >= VIDEO_CTA_LIMITS.MAX_PER_VIDEO

  const describeTiming = (cta: VideoCta) =>
    match(cta)
      .with({ placement: VIDEO_CTA_PLACEMENTS.END_SCREEN }, () =>
        t("videos.ctas.timing.end_screen")
      )
      .with({ timing: VIDEO_CTA_TIMINGS.RANDOM }, () =>
        t("videos.ctas.timing.random", {
          start: formatChapterTime(cta.startSeconds ?? 0),
          end: formatChapterTime(cta.endSeconds ?? 0),
          count: cta.durationSeconds ?? 0,
        })
      )
      .with({ endSeconds: null }, () =>
        t("videos.ctas.timing.from", {
          start: formatChapterTime(cta.startSeconds ?? 0),
        })
      )
      .otherwise(() =>
        t("videos.ctas.timing.between", {
          start: formatChapterTime(cta.startSeconds ?? 0),
          end: formatChapterTime(cta.endSeconds ?? 0),
        })
      )

  return (
    <section className="flex flex-col gap-4">
      <p className="text-xs text-muted-foreground">
        {t("videos.ctas.description")}
      </p>
      {isPending && <Skeleton className="h-16 w-full rounded-lg" />}
      {ctas?.length === 0 && (
        <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
          {t("videos.ctas.empty")}
        </p>
      )}
      {ctas && ctas.length > 0 && (
        <ul className="flex flex-col divide-y rounded-lg border">
          {ctas.map((cta) => {
            const KindIcon =
              cta.kind === VIDEO_CTA_KINDS.EMAIL
                ? MailIcon
                : MousePointerClickIcon

            return (
              <li key={cta.id} className="flex items-center gap-3 px-3 py-2">
                <KindIcon className="size-4 shrink-0 text-muted-foreground" />
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-medium">
                    {cta.heading}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {t(`videos.ctas.kinds.${cta.kind}.label`)} ·{" "}
                    {describeTiming(cta)}
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={t("videos.ctas.edit", { heading: cta.heading })}
                  onClick={() => setDialog({ cta, openedAt: Date.now() })}
                >
                  <PencilIcon />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={t("videos.ctas.delete", { heading: cta.heading })}
                  onClick={() => setCtaToDelete(cta)}
                >
                  <Trash2Icon />
                </Button>
              </li>
            )
          })}
        </ul>
      )}
      <div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={isPending || isAtLimit}
          title={
            isAtLimit
              ? t("videos.ctas.too_many", {
                  max: VIDEO_CTA_LIMITS.MAX_PER_VIDEO,
                })
              : undefined
          }
          onClick={() => setDialog({ cta: null, openedAt: Date.now() })}
        >
          <PlusIcon />
          {t("videos.ctas.add")}
        </Button>
      </div>
      {dialog && (
        <VideoCtaDialog
          key={`${dialog.cta?.id ?? "new"}-${dialog.openedAt}`}
          organizationSlug={organizationSlug}
          libraryId={libraryId}
          videoId={video.id}
          durationSeconds={video.durationSeconds ?? 0}
          currentSeconds={currentSeconds}
          cta={dialog.cta}
          open
          onOpenChange={(open) => {
            if (!open) setDialog(null)
          }}
        />
      )}
      <AlertDialog
        open={Boolean(ctaToDelete)}
        onOpenChange={(open) => {
          if (!open) setCtaToDelete(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("videos.ctas.delete_title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("videos.ctas.delete_description", {
                heading: ctaToDelete?.heading ?? "",
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isDeletePending}
              onClick={() => {
                if (ctaToDelete) deleteCta(ctaToDelete.id)
              }}
            >
              {t("videos.ctas.delete_confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}
