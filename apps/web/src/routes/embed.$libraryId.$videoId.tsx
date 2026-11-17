import { createFileRoute } from "@tanstack/react-router"

import { createPageMeta } from "@/lib/page-meta"
import { VideoEmbedPlayer } from "@/modules/embed/components/video-embed-player"
import { loadVideoEmbed } from "@/modules/embed/embed.functions"
import { videoEmbedSearchSchema } from "@/modules/embed/embed.schemas"

/**
 * The embeddable player, framed by customers' sites. It renders on the
 * server, which checks the framing page against the library's playback
 * hosts and limits who may frame it.
 */
export const Route = createFileRoute("/embed/$libraryId/$videoId")({
  validateSearch: videoEmbedSearchSchema,
  loaderDeps: ({ search: { key, expires, token } }) => ({
    key,
    expires,
    token,
  }),
  loader: ({ params, deps }) =>
    loadVideoEmbed({ data: { ...params, ...deps } }),
  head: ({ loaderData }) => ({
    meta: createPageMeta({
      title: loaderData?.embed?.title ?? "Video",
      description: "Embedded video player.",
    }),
  }),
  component: VideoEmbedRoute,
})

function VideoEmbedRoute() {
  const result = Route.useLoaderData()
  const options = Route.useSearch()

  return (
    <main className="fixed inset-0 bg-black">
      <VideoEmbedPlayer result={result} options={options} />
    </main>
  )
}
