import { createFileRoute, useNavigate } from "@tanstack/react-router"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@workspace/ui/components/empty"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { ListVideoIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { P, match } from "ts-pattern"

import { useLibraryPlaylistsQuery } from "@/api/queries/libraries/useLibraryPlaylistsQuery"
import { createPageMeta } from "@/lib/page-meta"
import { PlaylistCreateDialog } from "@/modules/libraries/components/playlist-create-dialog"
import { PlaylistDetailsSheet } from "@/modules/libraries/components/playlist-details-sheet"
import { PlaylistTable } from "@/modules/libraries/components/playlist-table"
import { libraryPlaylistsSearchSchema } from "@/modules/libraries/libraries.schemas"

export const Route = createFileRoute(
  "/_authenticated/$organizationSlug/libraries/$libraryId/playlists"
)({
  head: () => ({
    meta: createPageMeta({
      title: "Library playlists",
      description: "Group a library's videos into playlists.",
    }),
  }),
  validateSearch: libraryPlaylistsSearchSchema,
  component: LibraryPlaylistsRoute,
})

function LibraryPlaylistsRoute() {
  const { t } = useTranslation()
  const { organizationSlug, libraryId } = Route.useParams()
  const { playlist: openPlaylistId } = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })
  const { data: playlists, isPending } = useLibraryPlaylistsQuery(
    organizationSlug,
    libraryId
  )
  const showPlaylist = (playlistId: string | undefined) =>
    void navigate({ search: { playlist: playlistId } })

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 sm:px-5">
        <p className="text-sm text-muted-foreground">
          {t("playlists.description")}
        </p>
        <PlaylistCreateDialog
          organizationSlug={organizationSlug}
          libraryId={libraryId}
          onCreated={showPlaylist}
        />
      </div>
      {match({ isPending, playlists })
        .with({ isPending: true }, () => (
          <section className="px-4 pb-5 sm:px-5">
            <Skeleton className="h-40 w-full" />
          </section>
        ))
        .with({ playlists: P.when((value) => !value?.length) }, () => (
          <Empty className="min-h-64 rounded-none border-0 border-t py-14">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <ListVideoIcon />
              </EmptyMedia>
              <EmptyTitle>{t("playlists.empty.title")}</EmptyTitle>
              <EmptyDescription>
                {t("playlists.empty.description")}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ))
        .otherwise(() => (
          <div className="border-t">
            <PlaylistTable
              organizationSlug={organizationSlug}
              libraryId={libraryId}
              playlists={playlists ?? []}
              onOpenPlaylist={showPlaylist}
            />
          </div>
        ))}
      <PlaylistDetailsSheet
        organizationSlug={organizationSlug}
        libraryId={libraryId}
        playlistId={openPlaylistId}
        onClose={() => showPlaylist(undefined)}
      />
    </>
  )
}
