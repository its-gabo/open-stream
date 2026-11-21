import { standardSchemaResolver } from "@hookform/resolvers/standard-schema"
import {
  VIDEO_CTA_KINDS,
  VIDEO_CTA_LIMITS,
  VIDEO_CTA_PLACEMENTS,
  VIDEO_CTA_TIMINGS,
} from "@workspace/shared"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Switch } from "@workspace/ui/components/switch"
import { Textarea } from "@workspace/ui/components/textarea"
import { cn } from "@workspace/ui/lib/utils"
import { LoaderCircleIcon } from "lucide-react"
import { useId } from "react"
import { Controller, useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { videoCtaFormSchema } from "../libraries.schemas"
import { DEFAULT_RANDOM_CTA_SECONDS } from "../libraries.constants"
import { formatChapterTime } from "../libraries.utils"

import type { ReactNode } from "react"
import type { FieldError } from "react-hook-form"
import type { VideoCta } from "@/api/generated-api"
import type { VideoCtaFormInput, VideoCtaFormValues } from "../libraries.types"
import { useVideoCtaCreateMutation } from "@/api/mutations/libraries/useVideoCtaCreateMutation"
import { useVideoCtaUpdateMutation } from "@/api/mutations/libraries/useVideoCtaUpdateMutation"

type VideoCtaDialogProps = {
  organizationSlug: string
  libraryId: string
  videoId: string
  durationSeconds: number
  /** Where the player is, as the start of a new overlay; mount the dialog anew each time it opens. */
  currentSeconds: number
  /** The call to action edited; a new one while null. */
  cta: VideoCta | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const toFormValues = (
  cta: VideoCta | null,
  currentSeconds: number
): VideoCtaFormInput => ({
  kind: cta?.kind ?? VIDEO_CTA_KINDS.BUTTON,
  placement: cta?.placement ?? VIDEO_CTA_PLACEMENTS.OVERLAY,
  startTime: formatChapterTime(cta?.startSeconds ?? Math.floor(currentSeconds)),
  endTime: cta?.endSeconds == null ? "" : formatChapterTime(cta.endSeconds),
  timing: cta?.timing ?? VIDEO_CTA_TIMINGS.FIXED,
  displaySeconds: String(cta?.durationSeconds ?? DEFAULT_RANDOM_CTA_SECONDS),
  heading: cta?.heading ?? "",
  body: cta?.body ?? "",
  buttonLabel: cta?.buttonLabel ?? "",
  buttonUrl: cta?.buttonUrl ?? "",
  consentText: cta?.consentText ?? "",
  dismissible: cta?.dismissible ?? true,
})

/** Adds a call to action to a video, or changes one: what it asks, where it shows and what it says. */
export function VideoCtaDialog({
  organizationSlug,
  libraryId,
  videoId,
  durationSeconds,
  currentSeconds,
  cta,
  open,
  onOpenChange,
}: VideoCtaDialogProps) {
  const { t } = useTranslation()
  const idPrefix = useId()
  const form = useForm<VideoCtaFormInput, unknown, VideoCtaFormValues>({
    resolver: standardSchemaResolver(videoCtaFormSchema(t, durationSeconds)),
    mode: "onChange",
    // Mounted for each opening, so a new overlay starts where the player was then.
    defaultValues: toFormValues(cta, currentSeconds),
  })
  const close = () => onOpenChange(false)
  const { mutate: createCta, isPending: isCreatePending } =
    useVideoCtaCreateMutation(organizationSlug, libraryId, videoId, {
      onSuccess: close,
    })
  const { mutate: updateCta, isPending: isUpdatePending } =
    useVideoCtaUpdateMutation(organizationSlug, libraryId, videoId, {
      onSuccess: close,
    })
  const isPending = isCreatePending || isUpdatePending
  const kind = form.watch("kind")
  const placement = form.watch("placement")
  const isRandom = form.watch("timing") === VIDEO_CTA_TIMINGS.RANDOM
  const { errors } = form.formState
  const fieldId = (name: keyof VideoCtaFormInput) => `${idPrefix}-${name}`

  const saveCta = form.handleSubmit((body) => {
    if (cta) updateCta({ ctaId: cta.id, ...body })
    else createCta(body)
  })

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        onOpenChange(isOpen)

        if (!isOpen) form.reset()
      }}
    >
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <form className="flex flex-col gap-4" noValidate onSubmit={saveCta}>
          <DialogHeader>
            <DialogTitle>
              {cta ? t("videos.ctas.edit_title") : t("videos.ctas.add_title")}
            </DialogTitle>
            <DialogDescription>
              {t("videos.ctas.dialog_description")}
            </DialogDescription>
          </DialogHeader>
          <Controller
            control={form.control}
            name="kind"
            render={({ field }) => (
              <ChoiceGroup
                label={t("videos.ctas.fields.kind")}
                value={field.value}
                options={Object.values(VIDEO_CTA_KINDS).map((value) => ({
                  value,
                  label: t(`videos.ctas.kinds.${value}.label`),
                  hint: t(`videos.ctas.kinds.${value}.hint`),
                }))}
                onChange={(value) => {
                  field.onChange(value)
                  void form.trigger()
                }}
              />
            )}
          />
          <Controller
            control={form.control}
            name="placement"
            render={({ field }) => (
              <ChoiceGroup
                label={t("videos.ctas.fields.placement")}
                value={field.value}
                options={Object.values(VIDEO_CTA_PLACEMENTS).map((value) => ({
                  value,
                  label: t(`videos.ctas.placements.${value}.label`),
                  hint: t(`videos.ctas.placements.${value}.hint`),
                }))}
                onChange={(value) => {
                  field.onChange(value)
                  void form.trigger()
                }}
              />
            )}
          />
          {placement === VIDEO_CTA_PLACEMENTS.OVERLAY && (
            <Controller
              control={form.control}
              name="timing"
              render={({ field }) => (
                <ChoiceGroup
                  label={t("videos.ctas.fields.timing")}
                  value={field.value}
                  options={Object.values(VIDEO_CTA_TIMINGS).map((value) => ({
                    value,
                    label: t(`videos.ctas.timings.${value}.label`),
                    hint: t(`videos.ctas.timings.${value}.hint`),
                  }))}
                  onChange={(value) => {
                    field.onChange(value)
                    void form.trigger()
                  }}
                />
              )}
            />
          )}
          {placement === VIDEO_CTA_PLACEMENTS.OVERLAY && (
            <div className="grid gap-4 sm:grid-cols-2">
              <TextInputField
                id={fieldId("startTime")}
                label={
                  isRandom
                    ? t("videos.ctas.fields.window_start")
                    : t("videos.ctas.fields.start")
                }
                error={errors.startTime}
              >
                <div className="flex gap-2">
                  <Input
                    id={fieldId("startTime")}
                    className="font-mono"
                    placeholder="0:00"
                    autoComplete="off"
                    inputMode="decimal"
                    aria-invalid={Boolean(errors.startTime) || undefined}
                    {...form.register("startTime", { deps: ["endTime"] })}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="shrink-0"
                    onClick={() =>
                      form.setValue(
                        "startTime",
                        formatChapterTime(Math.floor(currentSeconds)),
                        { shouldDirty: true, shouldValidate: true }
                      )
                    }
                  >
                    {t("videos.ctas.use_player_time", {
                      time: formatChapterTime(Math.floor(currentSeconds)),
                    })}
                  </Button>
                </div>
              </TextInputField>
              <TextInputField
                id={fieldId("endTime")}
                label={
                  isRandom
                    ? t("videos.ctas.fields.window_end")
                    : t("videos.ctas.fields.end")
                }
                hint={isRandom ? undefined : t("videos.ctas.fields.end_hint")}
                error={errors.endTime}
              >
                <Input
                  id={fieldId("endTime")}
                  className="font-mono"
                  placeholder={formatChapterTime(durationSeconds)}
                  autoComplete="off"
                  inputMode="decimal"
                  aria-invalid={Boolean(errors.endTime) || undefined}
                  {...form.register("endTime", { deps: ["displaySeconds"] })}
                />
              </TextInputField>
              {isRandom && (
                <TextInputField
                  id={fieldId("displaySeconds")}
                  label={t("videos.ctas.fields.display_seconds")}
                  hint={t("videos.ctas.fields.display_seconds_hint")}
                  error={errors.displaySeconds}
                >
                  <Input
                    id={fieldId("displaySeconds")}
                    type="number"
                    inputMode="numeric"
                    min={VIDEO_CTA_LIMITS.MIN_LENGTH_SECONDS}
                    className="w-28"
                    aria-invalid={Boolean(errors.displaySeconds) || undefined}
                    {...form.register("displaySeconds")}
                  />
                </TextInputField>
              )}
            </div>
          )}
          <TextInputField
            id={fieldId("heading")}
            label={t("videos.ctas.fields.heading")}
            error={errors.heading}
          >
            <Input
              id={fieldId("heading")}
              autoComplete="off"
              maxLength={VIDEO_CTA_LIMITS.HEADING_MAX_LENGTH}
              placeholder={t("videos.ctas.fields.heading_placeholder")}
              aria-invalid={Boolean(errors.heading) || undefined}
              {...form.register("heading")}
            />
          </TextInputField>
          <TextInputField
            id={fieldId("body")}
            label={t("videos.ctas.fields.body")}
            error={errors.body}
          >
            <Textarea
              id={fieldId("body")}
              rows={2}
              maxLength={VIDEO_CTA_LIMITS.BODY_MAX_LENGTH}
              placeholder={t("videos.ctas.fields.body_placeholder")}
              aria-invalid={Boolean(errors.body) || undefined}
              {...form.register("body")}
            />
          </TextInputField>
          <TextInputField
            id={fieldId("buttonLabel")}
            label={t("videos.ctas.fields.button_label")}
            error={errors.buttonLabel}
          >
            <Input
              id={fieldId("buttonLabel")}
              autoComplete="off"
              maxLength={VIDEO_CTA_LIMITS.BUTTON_LABEL_MAX_LENGTH}
              placeholder={t(`videos.ctas.kinds.${kind}.button_placeholder`)}
              aria-invalid={Boolean(errors.buttonLabel) || undefined}
              {...form.register("buttonLabel")}
            />
          </TextInputField>
          {kind === VIDEO_CTA_KINDS.BUTTON ? (
            <TextInputField
              id={fieldId("buttonUrl")}
              label={t("videos.ctas.fields.button_url")}
              error={errors.buttonUrl}
            >
              <Input
                id={fieldId("buttonUrl")}
                type="url"
                autoComplete="off"
                placeholder="https://"
                aria-invalid={Boolean(errors.buttonUrl) || undefined}
                {...form.register("buttonUrl")}
              />
            </TextInputField>
          ) : (
            <TextInputField
              id={fieldId("consentText")}
              label={t("videos.ctas.fields.consent_text")}
              hint={t("videos.ctas.fields.consent_text_hint")}
              error={errors.consentText}
            >
              <Textarea
                id={fieldId("consentText")}
                rows={2}
                maxLength={VIDEO_CTA_LIMITS.CONSENT_TEXT_MAX_LENGTH}
                placeholder={t("videos.ctas.fields.consent_text_placeholder")}
                aria-invalid={Boolean(errors.consentText) || undefined}
                {...form.register("consentText")}
              />
            </TextInputField>
          )}
          <Controller
            control={form.control}
            name="dismissible"
            render={({ field }) => (
              <div className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2">
                <div className="flex flex-col gap-0.5">
                  <Label htmlFor={fieldId("dismissible")}>
                    {t("videos.ctas.fields.dismissible")}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {t("videos.ctas.fields.dismissible_hint")}
                  </p>
                </div>
                <Switch
                  id={fieldId("dismissible")}
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </div>
            )}
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={close}>
              {t("common.cancel")}
            </Button>
            <Button
              type="submit"
              disabled={isPending || (Boolean(cta) && !form.formState.isDirty)}
            >
              {isPending && <LoaderCircleIcon className="animate-spin" />}
              {cta ? t("videos.ctas.save") : t("videos.ctas.add")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function TextInputField({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string
  label: string
  hint?: string
  error?: FieldError
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error?.message ? (
        <p className="text-xs text-destructive">{error.message}</p>
      ) : (
        hint && <p className="text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  )
}

/** Options shown side by side, one of them chosen, each with a short hint. */
function ChoiceGroup<TValue extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: TValue
  options: { value: TValue; label: string; hint: string }[]
  onChange: (value: TValue) => void
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm leading-none font-medium">{label}</span>
      <div
        role="radiogroup"
        aria-label={label}
        className="grid gap-2 sm:grid-cols-2"
      >
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={option.value === value}
            className={cn(
              "flex flex-col gap-0.5 rounded-lg border px-3 py-2 text-left transition focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
              option.value === value
                ? "border-primary bg-primary/5"
                : "hover:bg-muted"
            )}
            onClick={() => onChange(option.value)}
          >
            <span className="text-sm font-medium">{option.label}</span>
            <span className="text-xs text-muted-foreground">{option.hint}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
