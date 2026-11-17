import { standardSchemaResolver } from "@hookform/resolvers/standard-schema"
import { PLAYER_ACCENT_COLOR_PATTERN } from "@workspace/shared"
import { Button } from "@workspace/ui/components/button"
import { CardDescription, CardTitle } from "@workspace/ui/components/card"
import { ColorInput } from "@workspace/ui/components/color-picker"
import { Label } from "@workspace/ui/components/label"
import { Switch } from "@workspace/ui/components/switch"
import { LoaderCircleIcon, PaletteIcon, SaveIcon } from "lucide-react"
import { Controller, useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"

import {
  LIBRARY_PLAYER_SWITCHES,
  PLAYER_ACCENT_SWATCHES,
} from "../libraries.constants"
import { libraryPlayerFormSchema } from "../libraries.schemas"
import { LibraryPlayerPreview } from "./library-player-preview"

import type { LibraryPlayerSettings } from "@/api/generated-api"
import type { LibraryPlayerFormValues } from "../libraries.types"

import { useLibraryPlayerUpdateMutation } from "@/api/mutations/libraries/useLibraryPlayerUpdateMutation"

type LibraryPlayerFormProps = {
  organizationSlug: string
  libraryId: string
  player: LibraryPlayerSettings
}

const ACCENT_COLOR_FIELD_ID = "library-player-accent-color"

/** The accent color and controls of the library's embedded player, with a preview of the result. */
export function LibraryPlayerForm({
  organizationSlug,
  libraryId,
  player,
}: LibraryPlayerFormProps) {
  const { t } = useTranslation()
  const form = useForm<LibraryPlayerFormValues>({
    resolver: standardSchemaResolver(libraryPlayerFormSchema(t)),
    mode: "onChange",
    defaultValues: player,
  })
  const accentColorError = form.formState.errors.accentColor
  const values = form.watch()
  const accentColor = values.accentColor.trim().toLowerCase()
  const isAccentColorValid = PLAYER_ACCENT_COLOR_PATTERN.test(accentColor)

  const { mutate: updatePlayer, isPending } = useLibraryPlayerUpdateMutation(
    organizationSlug,
    libraryId,
    { onSuccess: () => form.reset(form.getValues()) }
  )

  return (
    <section className="flex flex-col gap-4 p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <PaletteIcon className="size-5" />
        </span>
        <div>
          <CardTitle>{t("libraries.player.title")}</CardTitle>
          <CardDescription>{t("libraries.player.description")}</CardDescription>
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <form
          className="flex flex-col gap-5"
          noValidate
          onSubmit={(event) => {
            void form.handleSubmit((submitted) => updatePlayer(submitted))(
              event
            )
          }}
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor={ACCENT_COLOR_FIELD_ID}>
              {t("libraries.player.accent_color")}
            </Label>
            <Controller
              control={form.control}
              name="accentColor"
              render={({ field }) => (
                <ColorInput
                  id={ACCENT_COLOR_FIELD_ID}
                  className="max-w-44"
                  aria-invalid={Boolean(accentColorError) || undefined}
                  swatches={PLAYER_ACCENT_SWATCHES.map((swatch) => ({
                    value: swatch.value,
                    label: t(`libraries.player.swatches.${swatch.labelKey}`),
                  }))}
                  labels={{
                    trigger: t("libraries.player.accent_color_picker"),
                    area: t("libraries.player.accent_color_area"),
                    hue: t("libraries.player.accent_color_hue"),
                    swatches: t("libraries.player.accent_color_swatches"),
                  }}
                  {...field}
                />
              )}
            />
            {accentColorError ? (
              <p className="text-xs text-destructive">
                {accentColorError.message}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                {t("libraries.player.accent_color_hint")}
              </p>
            )}
          </div>
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-sm font-medium">
              {t("libraries.player.controls")}
            </legend>
            <div className="divide-y rounded-lg border">
              {LIBRARY_PLAYER_SWITCHES.map((name) => {
                const switchId = `library-player-${name}`

                return (
                  <div
                    key={name}
                    className="flex items-start justify-between gap-4 p-3"
                  >
                    <div>
                      <Label htmlFor={switchId}>
                        {t(`libraries.player.fields.${name}.label`)}
                      </Label>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {t(`libraries.player.fields.${name}.hint`)}
                      </p>
                    </div>
                    <Controller
                      control={form.control}
                      name={name}
                      render={({ field }) => (
                        <Switch
                          id={switchId}
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      )}
                    />
                  </div>
                )
              })}
            </div>
          </fieldset>
          <p className="text-xs text-muted-foreground">
            {t("libraries.player.hint")}
          </p>
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isPending || !form.formState.isDirty}
            >
              {isPending ? (
                <LoaderCircleIcon className="animate-spin" />
              ) : (
                <SaveIcon />
              )}
              {t("libraries.player.save")}
            </Button>
          </div>
        </form>
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">{t("libraries.player.preview")}</p>
          <LibraryPlayerPreview
            settings={{
              ...values,
              accentColor: isAccentColorValid
                ? accentColor
                : player.accentColor,
            }}
          />
        </div>
      </div>
    </section>
  )
}
