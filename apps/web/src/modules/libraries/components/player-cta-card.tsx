import {
  VIDEO_CTA_KINDS,
  VIDEO_CTA_PLACEMENTS,
  videoCtaLeadInputSchema,
} from "@workspace/shared"
import { cn } from "@workspace/ui/lib/utils"
import { ExternalLinkIcon, LoaderCircleIcon, XIcon } from "lucide-react"
import { useId, useState } from "react"
import { useTranslation } from "react-i18next"
import { match } from "ts-pattern"

import { PLAYER_CTA_FORM_STATES } from "../libraries.constants"

import type { PlayerCtaFormState } from "../libraries.types"
import type { VideoCtaLeadBody, VideoEmbedCta } from "@/api/generated-api"

type PlayerCtaCardProps = {
  cta: VideoEmbedCta
  /** Leaves the viewer's email address; null where leads cannot be left, e.g. in a preview. */
  onSubmitLead: ((body: VideoCtaLeadBody) => Promise<boolean>) | null
  onClickButton: () => void
  onClose: () => void
  /** Reported once the viewer closes it without answering. */
  onDismiss: () => void
}

/**
 * A call to action over the player: a card in the corner while the video
 * plays, or over the last frame once it ended. A button opens its link in
 * a new tab; an email form takes an address once its consent box is ticked.
 */
export function PlayerCtaCard({
  cta,
  onSubmitLead,
  onClickButton,
  onClose,
  onDismiss,
}: PlayerCtaCardProps) {
  const { t } = useTranslation()
  const idPrefix = useId()
  const [email, setEmail] = useState("")
  const [hasConsented, setHasConsented] = useState(false)
  const [formState, setFormState] = useState<PlayerCtaFormState>(
    PLAYER_CTA_FORM_STATES.IDLE
  )
  const isEndScreen = cta.placement === VIDEO_CTA_PLACEMENTS.END_SCREEN
  const isAnswered = formState === PLAYER_CTA_FORM_STATES.SENT
  const lead = videoCtaLeadInputSchema.safeParse({
    email,
    consent: hasConsented,
  })

  const submitLead = async () => {
    if (!onSubmitLead || !lead.success) return

    setFormState(PLAYER_CTA_FORM_STATES.SENDING)
    setFormState(
      (await onSubmitLead(lead.data))
        ? PLAYER_CTA_FORM_STATES.SENT
        : PLAYER_CTA_FORM_STATES.FAILED
    )
  }

  return (
    <div
      role="dialog"
      aria-label={cta.heading}
      className={cn(
        "absolute z-10 flex flex-col gap-2 rounded-md bg-neutral-900/95 p-3 text-white shadow-2xl",
        isEndScreen
          ? "inset-0 m-auto h-fit w-[min(24rem,calc(100%-1.5rem))] p-4"
          : "top-3 right-3 w-[min(18rem,calc(100%-1.5rem))]"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p
          className={cn("font-semibold", isEndScreen ? "text-base" : "text-sm")}
        >
          {cta.heading}
        </p>
        {(cta.dismissible || isAnswered) && (
          <button
            type="button"
            aria-label={t("videos.player.cta.close")}
            className="-mt-1 -mr-1 flex size-7 shrink-0 items-center justify-center rounded-md hover:bg-white/15 focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none"
            onClick={() => {
              if (!isAnswered) onDismiss()
              onClose()
            }}
          >
            <XIcon className="size-4" />
          </button>
        )}
      </div>
      {cta.body && (
        <p className="text-xs text-white/80 [@container(max-height:14rem)]:hidden">
          {cta.body}
        </p>
      )}
      {match(cta.kind)
        .with(VIDEO_CTA_KINDS.BUTTON, () => (
          <a
            href={cta.buttonUrl ?? undefined}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-8 items-center justify-center gap-1.5 rounded-md bg-white px-3 text-sm font-medium text-neutral-900 transition hover:bg-white/90 focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none"
            onClick={onClickButton}
          >
            {cta.buttonLabel}
            <ExternalLinkIcon className="size-3.5" />
          </a>
        ))
        .with(VIDEO_CTA_KINDS.EMAIL, () =>
          isAnswered ? (
            <p className="text-sm text-white/90" aria-live="polite">
              {t("videos.player.cta.thanks")}
            </p>
          ) : (
            <form
              className="flex flex-col gap-2"
              noValidate
              onSubmit={(event) => {
                event.preventDefault()
                void submitLead()
              }}
            >
              <input
                type="email"
                autoComplete="email"
                required
                aria-label={t("videos.player.cta.email")}
                placeholder={t("videos.player.cta.email_placeholder")}
                className="h-8 rounded-md border border-white/20 bg-white/10 px-2.5 text-sm text-white placeholder:text-white/50 focus-visible:border-white/60 focus-visible:outline-none"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
              <label
                htmlFor={`${idPrefix}-consent`}
                className="flex items-start gap-2 text-xs text-white/80"
              >
                <input
                  id={`${idPrefix}-consent`}
                  type="checkbox"
                  className="mt-0.5 size-3.5 shrink-0 accent-white"
                  checked={hasConsented}
                  onChange={(event) => setHasConsented(event.target.checked)}
                />
                {cta.consentText}
              </label>
              <button
                type="submit"
                disabled={
                  !onSubmitLead ||
                  !lead.success ||
                  formState === PLAYER_CTA_FORM_STATES.SENDING
                }
                className="flex h-8 items-center justify-center gap-1.5 rounded-md bg-white px-3 text-sm font-medium text-neutral-900 transition hover:bg-white/90 focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none disabled:opacity-50"
              >
                {formState === PLAYER_CTA_FORM_STATES.SENDING && (
                  <LoaderCircleIcon className="size-4 animate-spin" />
                )}
                {cta.buttonLabel}
              </button>
              {formState === PLAYER_CTA_FORM_STATES.FAILED && (
                <p className="text-xs text-red-300" aria-live="polite">
                  {t("videos.player.cta.failed")}
                </p>
              )}
              {!onSubmitLead && (
                <p className="text-xs text-white/60">
                  {t("videos.player.cta.preview")}
                </p>
              )}
            </form>
          )
        )
        .exhaustive()}
    </div>
  )
}
