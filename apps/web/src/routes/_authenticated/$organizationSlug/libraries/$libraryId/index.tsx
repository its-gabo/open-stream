import { createFileRoute, useNavigate } from "@tanstack/react-router"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@workspace/ui/components/empty"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { FilmIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { P, match } from "ts-pattern"

import { useLibraryVideosQuery } from "@/api/queries/libraries/useLibraryVideosQuery"
import { createPageMeta } from "@/lib/page-meta"
import { VideoCreateDialog } from "@/modules/libraries/components/video-create-dialog"
import { VideoDetailsSheet } from "@/modules/libraries/components/video-details-sheet"
import { VideoTable } from "@/modules/libraries/components/video-table"
import { libraryVideosSearchSchema } from "@/modules/libraries/libraries.schemas"

export const Route = createFileRoute(
  "/_authenticated/$organizationSlug/libraries/$libraryId/"
)({
  head: () => ({
    meta: createPageMeta({
      title: "Library videos",
      description: "Upload and manage the videos of a library.",
    }),
  }),
  validateSearch: libraryVideosSearchSchema,
  component: LibraryVideosRoute,
})

function LibraryVideosRoute() {
  const { t } = useTranslation()
  const { organizationSlug, libraryId } = Route.useParams()
  const { video: openVideoId } = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })
  const { data: videos, isPending } = useLibraryVideosQuery(
    organizationSlug,
    libraryId
  )
  const openVideo = videos?.find(({ id }) => id === openVideoId) ?? null
  const showVideo = (videoId: string | undefined) =>
    void navigate({ search: { video: videoId } })

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 sm:px-5">
        <p className="text-sm text-muted-foreground">
          {t("videos.description")}
        </p>
        <VideoCreateDialog
          organizationSlug={organizationSlug}
          libraryId={libraryId}
        />
      </div>
      {match({ isPending, videos })
        .with({ isPending: true }, () => (
          <section className="px-4 pb-5 sm:px-5">
            <Skeleton className="h-40 w-full" />
          </section>
        ))
        .with({ videos: P.when((value) => !value?.length) }, () => (
          <Empty className="min-h-64 rounded-none border-0 border-t py-14">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <FilmIcon />
              </EmptyMedia>
              <EmptyTitle>{t("videos.empty.title")}</EmptyTitle>
              <EmptyDescription>
                {t("videos.empty.description")}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ))
        .otherwise(() => (
          <div className="border-t">
            <VideoTable
              organizationSlug={organizationSlug}
              libraryId={libraryId}
              videos={videos ?? []}
              onOpenVideo={showVideo}
            />
          </div>
        ))}
      <VideoDetailsSheet
        organizationSlug={organizationSlug}
        libraryId={libraryId}
        video={openVideo}
        onClose={() => showVideo(undefined)}
      />
    </>
  )
}
