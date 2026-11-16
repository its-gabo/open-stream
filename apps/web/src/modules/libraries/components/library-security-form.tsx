import { standardSchemaResolver } from "@hookform/resolvers/standard-schema"
import { LIBRARY_SECURITY_LIMITS } from "@workspace/shared"
import { Button } from "@workspace/ui/components/button"
import { CardDescription, CardTitle } from "@workspace/ui/components/card"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Switch } from "@workspace/ui/components/switch"
import {
  GlobeIcon,
  LoaderCircleIcon,
  PlusIcon,
  SaveIcon,
  ShieldCheckIcon,
  XIcon,
} from "lucide-react"
import { Controller, useFieldArray, useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { librarySecurityFormSchema } from "../libraries.schemas"

import type { LibrarySecuritySettings } from "@/api/generated-api"
import type {
  LibrarySecurityFormInput,
  LibrarySecurityFormValues,
} from "../libraries.types"

import { useLibrarySecurityUpdateMutation } from "@/api/mutations/libraries/useLibrarySecurityUpdateMutation"
import { toLibrarySecurityFormValues } from "../libraries.utils"

type LibrarySecurityFormProps = {
  organizationSlug: string
  libraryId: string
  security: LibrarySecuritySettings
}

const HOSTS_LABEL_ID = "library-allowed-playback-hosts"
const SIGNED_PLAYBACK_FIELD_ID = "library-require-signed-playback"

/** Which sites may play the library's videos, one input per site, and whether only signed URLs play. */
export function LibrarySecurityForm({
  organizationSlug,
  libraryId,
  security,
}: LibrarySecurityFormProps) {
  const { t } = useTranslation()
  const form = useForm<
    LibrarySecurityFormInput,
    unknown,
    LibrarySecurityFormValues
  >({
    resolver: standardSchemaResolver(librarySecurityFormSchema(t)),
    mode: "onChange",
    defaultValues: toLibrarySecurityFormValues(security),
  })
  const {
    fields: hostFields,
    append: appendHost,
    remove: removeHost,
  } = useFieldArray({ control: form.control, name: "allowedPlaybackHosts" })
  const hostErrors = form.formState.errors.allowedPlaybackHosts
  const isAtHostLimit =
    hostFields.length >= LIBRARY_SECURITY_LIMITS.MAX_PLAYBACK_HOSTS

  const { mutate: updateSecurity, isPending } =
    useLibrarySecurityUpdateMutation(organizationSlug, libraryId)

  return (
    <section className="flex flex-col gap-4 p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <ShieldCheckIcon className="size-5" />
        </span>
        <div>
          <CardTitle>{t("libraries.api.security.title")}</CardTitle>
          <CardDescription>
            {t("libraries.api.security.description")}
          </CardDescription>
        </div>
      </div>
      <form
        className="flex flex-col gap-5"
        noValidate
        onSubmit={(event) => {
          void form.handleSubmit((values) =>
            updateSecurity(values, {
              onSuccess: () =>
                form.reset(
                  toLibrarySecurityFormValues({
                    allowedPlaybackHosts: values.allowedPlaybackHosts,
                    requireSignedPlayback: values.requireSignedPlayback,
                  })
                ),
            })
          )(event)
        }}
      >
        <div
          role="group"
          aria-labelledby={HOSTS_LABEL_ID}
          className="flex flex-col gap-2"
        >
          <Label id={HOSTS_LABEL_ID}>
            {t("libraries.api.security.hosts_label")}
          </Label>
          {hostFields.length === 0 ? (
            <div className="flex items-center gap-2 rounded-lg border border-dashed px-3 py-2.5 text-sm text-muted-foreground">
              <GlobeIcon className="size-4 shrink-0" />
              {t("libraries.api.security.no_hosts")}
            </div>
          ) : (
            <ul className="flex flex-col gap-2">
              {hostFields.map((field, index) => {
                const error = hostErrors?.[index]?.host
                const host = form.watch(`allowedPlaybackHosts.${index}.host`)

                return (
                  <li key={field.id} className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <Input
                        className="font-mono text-xs"
                        placeholder={t(
                          "libraries.api.security.host_placeholder"
                        )}
                        autoComplete="off"
                        spellCheck={false}
                        aria-invalid={Boolean(error) || undefined}
                        aria-label={`${t("libraries.api.security.hosts_label")} ${index + 1}`}
                        {...form.register(`allowedPlaybackHosts.${index}.host`)}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={t("libraries.api.security.remove_host", {
                          host: host || index + 1,
                        })}
                        onClick={() => removeHost(index)}
                      >
                        <XIcon />
                      </Button>
                    </div>
                    {error && (
                      <p className="text-xs text-destructive">
                        {error.message}
                      </p>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
          <div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isAtHostLimit}
              title={
                isAtHostLimit
                  ? t("validation.playback_hosts.too_many", {
                      max: LIBRARY_SECURITY_LIMITS.MAX_PLAYBACK_HOSTS,
                    })
                  : undefined
              }
              onClick={() => appendHost({ host: "" })}
            >
              <PlusIcon />
              {t("libraries.api.security.add_host")}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            {t("libraries.api.security.hosts_hint")}
          </p>
        </div>
        <div className="flex items-start justify-between gap-4 rounded-lg border p-3">
          <div>
            <Label htmlFor={SIGNED_PLAYBACK_FIELD_ID}>
              {t("libraries.api.security.signed_label")}
            </Label>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("libraries.api.security.signed_hint")}
            </p>
          </div>
          <Controller
            control={form.control}
            name="requireSignedPlayback"
            render={({ field }) => (
              <Switch
                id={SIGNED_PLAYBACK_FIELD_ID}
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />
        </div>
        <div className="flex justify-end">
          <Button type="submit" disabled={isPending || !form.formState.isDirty}>
            {isPending ? (
              <LoaderCircleIcon className="animate-spin" />
            ) : (
              <SaveIcon />
            )}
            {t("libraries.api.security.save")}
          </Button>
        </div>
      </form>
    </section>
  )
}
