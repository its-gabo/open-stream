import { VIDEO_EMBED_QUERY_KEYS } from "@workspace/shared"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Switch } from "@workspace/ui/components/switch"
import { useId, useState } from "react"
import { useTranslation } from "react-i18next"

import { EMBED_OPTION_KEYS } from "../embed.constants"
import { buildEmbedCode, buildEmbedUrl } from "../embed.utils"

import type { EmbedCodeOptions } from "../embed.types"
import type { Video } from "@/api/generated-api"
import { useLibraryPlayerQuery } from "@/api/queries/libraries/useLibraryPlayerQuery"
import { CodeBlock } from "@/components/code-block"

type VideoEmbedSectionProps = {
  organizationSlug: string
  libraryId: string
  /** A processed video, so its size is known. */
  video: Video & { width: number; height: number }
}

const DEFAULT_OPTIONS: EmbedCodeOptions = {
  autoplay: false,
  muted: false,
  loop: false,
  startSeconds: 0,
  showTitle: null,
}

/** The iframe code for putting the video on another site, with the player's options. */
export function VideoEmbedSection({
  organizationSlug,
  libraryId,
  video,
}: VideoEmbedSectionProps) {
  const { t } = useTranslation()
  const idPrefix = useId()
  const [options, setOptions] = useState(DEFAULT_OPTIONS)
  const { data: player } = useLibraryPlayerQuery(organizationSlug, libraryId)
  const libraryShowsTitle = player?.showTitle
  const embedUrl = buildEmbedUrl(
    window.location.origin,
    libraryId,
    video.id,
    options,
    libraryShowsTitle
  )
  const switches = [
    ...EMBED_OPTION_KEYS.map((key) => ({
      key,
      checked: options[key],
      isDisabled: false,
    })),
    {
      key: VIDEO_EMBED_QUERY_KEYS.TITLE,
      checked: options.showTitle ?? libraryShowsTitle ?? false,
      // Its starting state is the library's, so it waits for that.
      isDisabled: libraryShowsTitle === undefined,
    },
  ]
  const updateOption = (key: (typeof switches)[number]["key"], on: boolean) =>
    setOptions((current) =>
      key === VIDEO_EMBED_QUERY_KEYS.TITLE
        ? { ...current, showTitle: on }
        : { ...current, [key]: on }
    )

  return (
    <section className="flex flex-col gap-3">
      <p className="text-xs text-muted-foreground">
        {t("embed.section.description")}
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {switches.map(({ key, checked, isDisabled }) => (
          <div
            key={key}
            className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2"
          >
            <Label htmlFor={`${idPrefix}-${key}`}>
              {t(`embed.options.${key}`)}
            </Label>
            <Switch
              id={`${idPrefix}-${key}`}
              checked={checked}
              disabled={isDisabled}
              onCheckedChange={(on) => updateOption(key, on)}
            />
          </div>
        ))}
        <div className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2 sm:col-span-2">
          <Label htmlFor={`${idPrefix}-start`}>
            {t("embed.options.start")}
          </Label>
          <Input
            id={`${idPrefix}-start`}
            type="number"
            inputMode="numeric"
            min={0}
            max={Math.floor(video.durationSeconds ?? 0)}
            className="w-24"
            value={options.startSeconds}
            onChange={(event) =>
              setOptions((current) => ({
                ...current,
                startSeconds: Math.max(
                  0,
                  Math.floor(Number(event.target.value) || 0)
                ),
              }))
            }
          />
        </div>
      </div>
      {options.autoplay && !options.muted && (
        <p className="text-xs text-muted-foreground">
          {t("embed.section.autoplay_muted")}
        </p>
      )}
      <CodeBlock code={buildEmbedCode(embedUrl, video.title, video)} />
      <p className="text-xs text-muted-foreground">
        {t("embed.section.restrictions")}
      </p>
    </section>
  )
}
