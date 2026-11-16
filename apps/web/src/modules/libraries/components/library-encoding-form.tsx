import { standardSchemaResolver } from "@hookform/resolvers/standard-schema"
import { VIDEO_QUALITIES, VIDEO_QUALITY_DETAILS } from "@workspace/shared"
import { Button } from "@workspace/ui/components/button"
import { CardDescription, CardTitle } from "@workspace/ui/components/card"
import { Label } from "@workspace/ui/components/label"
import { Switch } from "@workspace/ui/components/switch"
import { FilmIcon, LoaderCircleIcon, SaveIcon } from "lucide-react"
import { Controller, useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { libraryEncodingFormSchema } from "../libraries.schemas"

import type { LibraryEncodingSettings } from "@/api/generated-api"
import type { LibraryEncodingFormValues } from "../libraries.types"

import { useLibraryEncodingUpdateMutation } from "@/api/mutations/libraries/useLibraryEncodingUpdateMutation"

type LibraryEncodingFormProps = {
  organizationSlug: string
  libraryId: string
  encoding: LibraryEncodingSettings
}

/** The HLS qualities new uploads are transcoded to. */
export function LibraryEncodingForm({
  organizationSlug,
  libraryId,
  encoding,
}: LibraryEncodingFormProps) {
  const { t } = useTranslation()
  const form = useForm<LibraryEncodingFormValues>({
    resolver: standardSchemaResolver(libraryEncodingFormSchema(t)),
    mode: "onChange",
    defaultValues: { transcodeQualities: encoding.transcodeQualities },
  })
  const qualitiesError = form.formState.errors.transcodeQualities

  const { mutate: updateEncoding, isPending } =
    useLibraryEncodingUpdateMutation(organizationSlug, libraryId, {
      onSuccess: () => form.reset(form.getValues()),
    })

  return (
    <section className="flex flex-col gap-4 p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <FilmIcon className="size-5" />
        </span>
        <div>
          <CardTitle>{t("libraries.encoding.title")}</CardTitle>
          <CardDescription>
            {t("libraries.encoding.description")}
          </CardDescription>
        </div>
      </div>
      <form
        className="flex flex-col gap-4"
        noValidate
        onSubmit={(event) => {
          void form.handleSubmit((values) => updateEncoding(values))(event)
        }}
      >
        <Controller
          control={form.control}
          name="transcodeQualities"
          render={({ field }) => (
            <fieldset className="flex flex-col gap-2">
              <legend className="sr-only">
                {t("libraries.encoding.qualities")}
              </legend>
              <div className="divide-y rounded-lg border">
                {Object.values(VIDEO_QUALITIES).map((quality) => {
                  const switchId = `library-encoding-${quality}`
                  const details = VIDEO_QUALITY_DETAILS[quality]

                  return (
                    <div
                      key={quality}
                      className="flex items-center justify-between gap-4 p-3"
                    >
                      <div>
                        <Label htmlFor={switchId}>{quality}</Label>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {t("libraries.encoding.quality_details", {
                            width:
                              Math.round((details.shortSide * 16) / 9 / 2) * 2,
                            height: details.shortSide,
                            bitrate: details.videoBitrateKbps,
                          })}
                        </p>
                      </div>
                      <Switch
                        id={switchId}
                        checked={field.value.includes(quality)}
                        onCheckedChange={(checked) =>
                          field.onChange(
                            checked
                              ? [...field.value, quality]
                              : field.value.filter((each) => each !== quality)
                          )
                        }
                      />
                    </div>
                  )
                })}
              </div>
              {qualitiesError && (
                <p className="text-xs text-destructive">
                  {qualitiesError.message}
                </p>
              )}
            </fieldset>
          )}
        />
        <p className="text-xs text-muted-foreground">
          {t("libraries.encoding.hint")}
        </p>
        <div className="flex justify-end">
          <Button type="submit" disabled={isPending || !form.formState.isDirty}>
            {isPending ? (
              <LoaderCircleIcon className="animate-spin" />
            ) : (
              <SaveIcon />
            )}
            {t("libraries.encoding.save")}
          </Button>
        </div>
      </form>
    </section>
  )
}
