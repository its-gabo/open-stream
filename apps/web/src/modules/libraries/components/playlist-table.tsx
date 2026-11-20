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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { LoaderCircleIcon, Trash2Icon } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { formatDuration } from "../libraries.utils"

import type { PlaylistSummary } from "@/api/generated-api"

import { usePlaylistDeleteMutation } from "@/api/mutations/libraries/usePlaylistDeleteMutation"

type PlaylistTableProps = {
  organizationSlug: string
  libraryId: string
  playlists: PlaylistSummary[]
  /** Opens the playlist's sheet. */
  onOpenPlaylist: (playlistId: string) => void
}

export function PlaylistTable({
  organizationSlug,
  libraryId,
  playlists,
  onOpenPlaylist,
}: PlaylistTableProps) {
  const { t, i18n } = useTranslation()
  const [playlistToDelete, setPlaylistToDelete] =
    useState<PlaylistSummary | null>(null)

  const { mutate: deletePlaylist, isPending: isDeletePending } =
    usePlaylistDeleteMutation(organizationSlug, libraryId, {
      onSuccess: () => setPlaylistToDelete(null),
    })

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-4 sm:pl-5">
              {t("playlists.columns.title")}
            </TableHead>
            <TableHead>{t("playlists.columns.videos")}</TableHead>
            <TableHead>{t("playlists.columns.updated")}</TableHead>
            <TableHead className="w-0 pr-4 sm:pr-5" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {playlists.map((playlist) => (
            <TableRow
              key={playlist.id}
              className="cursor-pointer"
              onClick={() => onOpenPlaylist(playlist.id)}
            >
              <TableCell className="max-w-80 pl-4 sm:pl-5">
                <button
                  type="button"
                  className="block max-w-full truncate text-left font-medium hover:underline focus-visible:underline focus-visible:outline-none"
                  onClick={(event) => {
                    event.stopPropagation()
                    onOpenPlaylist(playlist.id)
                  }}
                >
                  {playlist.title}
                </button>
                {playlist.description && (
                  <p className="truncate text-xs text-muted-foreground">
                    {playlist.description}
                  </p>
                )}
              </TableCell>
              <TableCell className="whitespace-nowrap text-muted-foreground">
                {t("playlists.video_count", { count: playlist.videoCount })}
                {playlist.durationSeconds > 0 &&
                  ` · ${formatDuration(playlist.durationSeconds)}`}
              </TableCell>
              <TableCell className="whitespace-nowrap text-muted-foreground">
                {new Intl.DateTimeFormat(i18n.language, {
                  dateStyle: "medium",
                }).format(new Date(playlist.updatedAt))}
              </TableCell>
              <TableCell
                className="pr-4 sm:pr-5"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="flex justify-end">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={t("playlists.actions.delete")}
                    title={t("playlists.actions.delete")}
                    onClick={() => setPlaylistToDelete(playlist)}
                  >
                    <Trash2Icon />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <AlertDialog
        open={Boolean(playlistToDelete)}
        onOpenChange={(open) => {
          if (!open) setPlaylistToDelete(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("playlists.delete.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("playlists.delete.description", {
                title: playlistToDelete?.title ?? "",
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isDeletePending}
              onClick={() => {
                if (playlistToDelete) deletePlaylist(playlistToDelete.id)
              }}
            >
              {isDeletePending && <LoaderCircleIcon className="animate-spin" />}
              {t("playlists.delete.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
