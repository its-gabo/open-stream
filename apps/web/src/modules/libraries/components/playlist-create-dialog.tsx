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
import { LoaderCircleIcon, PlusIcon } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { playlistFormSchema } from "../libraries.schemas"

import type { PlaylistFormValues } from "../libraries.types"

import { usePlaylistCreateMutation } from "@/api/mutations/libraries/usePlaylistCreateMutation"
import { getFormFields } from "@/lib/get-form-fields"

type PlaylistCreateDialogProps = {
  organizationSlug: string
  libraryId: string
  /** Opens the new playlist, to add its videos. */
  onCreated: (playlistId: string) => void
}

export function PlaylistCreateDialog({
  organizationSlug,
  libraryId,
  onCreated,
}: PlaylistCreateDialogProps) {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const schema = playlistFormSchema(t)

  const form = useForm<PlaylistFormValues>({
    resolver: standardSchemaResolver(schema),
    mode: "onChange",
    defaultValues: { title: "", description: "" },
  })

  const { mutate: createPlaylist, isPending } = usePlaylistCreateMutation(
    organizationSlug,
    libraryId,
    {
      onSuccess: (playlist) => {
        setIsOpen(false)
        form.reset()
        onCreated(playlist.id)
      },
    }
  )

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger render={<Button />}>
        <PlusIcon />
        {t("playlists.create.trigger")}
      </DialogTrigger>
      <DialogContent>
        <form
          className="flex flex-col gap-4"
          noValidate
          onSubmit={(event) => {
            void form.handleSubmit((values) => createPlaylist(values))(event)
          }}
        >
          <DialogHeader>
            <DialogTitle>{t("playlists.create.title")}</DialogTitle>
            <DialogDescription>
              {t("playlists.create.description")}
            </DialogDescription>
          </DialogHeader>
          <FormFieldRenderer
            control={form.control}
            errors={form.formState.errors}
            fields={getFormFields(schema)}
          />
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending && <LoaderCircleIcon className="animate-spin" />}
              {t("playlists.create.submit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
