import { standardSchemaResolver } from "@hookform/resolvers/standard-schema"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog"
import { FormFieldRenderer } from "@workspace/ui/components/form-field-renderer"
import { LoaderCircleIcon, PencilIcon } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { playlistFormSchema } from "../libraries.schemas"

import type { PlaylistFormValues } from "../libraries.types"
import type { Playlist } from "@/api/generated-api"

import { usePlaylistUpdateMutation } from "@/api/mutations/libraries/usePlaylistUpdateMutation"
import { getFormFields } from "@/lib/get-form-fields"

type PlaylistEditDialogProps = {
  organizationSlug: string
  libraryId: string
  playlist: Playlist
}

/** Changes the playlist's title and description, shown over its episodes; opened from an icon button. */
export function PlaylistEditDialog({
  organizationSlug,
  libraryId,
  playlist,
}: PlaylistEditDialogProps) {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const schema = playlistFormSchema(t)
  const form = useForm<PlaylistFormValues>({
    resolver: standardSchemaResolver(schema),
    mode: "onChange",
    values: {
      title: playlist.title,
      description: playlist.description ?? "",
    },
  })
  const { mutate: updatePlaylist, isPending } = usePlaylistUpdateMutation(
    organizationSlug,
    libraryId,
    playlist.id,
    { onSuccess: () => setIsOpen(false) }
  )

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open)

        if (!open) form.reset()
      }}
    >
      <DialogTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={t("playlists.edit.trigger")}
            title={t("playlists.edit.trigger")}
          />
        }
      >
        <PencilIcon />
      </DialogTrigger>
      <DialogContent>
        <form
          className="flex flex-col gap-4"
          noValidate
          onSubmit={(event) => {
            void form.handleSubmit((values) => updatePlaylist(values))(event)
          }}
        >
          <DialogHeader>
            <DialogTitle>{t("playlists.edit.title")}</DialogTitle>
            <DialogDescription>
              {t("playlists.edit.description")}
            </DialogDescription>
          </DialogHeader>
          <FormFieldRenderer
            control={form.control}
            errors={form.formState.errors}
            fields={getFormFields(schema)}
          />
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="submit"
              disabled={isPending || !form.formState.isDirty}
            >
              {isPending && <LoaderCircleIcon className="animate-spin" />}
              {t("playlists.edit.submit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
