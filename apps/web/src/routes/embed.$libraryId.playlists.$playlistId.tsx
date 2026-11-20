import { createFileRoute } from "@tanstack/react-router"

import { createPageMeta } from "@/lib/page-meta"
import { PlaylistEmbedPlayer } from "@/modules/embed/components/playlist-embed-player"
import { loadPlaylistEmbed } from "@/modules/embed/embed.functions"
import { playlistEmbedSearchSchema } from "@/modules/embed/embed.schemas"

/**
 * The embeddable player for a playlist, framed by customers' sites like a
 * single video's. It renders on the server, which checks the framing page
 * against the library's playback hosts and limits who may frame it.
 */
export const Route = createFileRoute("/embed/$libraryId/playlists/$playlistId")(
  {
    validateSearch: playlistEmbedSearchSchema,
    loaderDeps: ({ search: { key, expires, token } }) => ({
      key,
      expires,
      token,
    }),
    loader: ({ params, deps }) =>
      loadPlaylistEmbed({ data: { ...params, ...deps } }),
    head: ({ loaderData }) => ({
      meta: createPageMeta({
        title: loaderData?.embed?.title ?? "Playlist",
        description: "Embedded playlist player.",
      }),
    }),
    component: PlaylistEmbedRoute,
  }
)

function PlaylistEmbedRoute() {
  const result = Route.useLoaderData()
  const options = Route.useSearch()

  return (
    <main className="fixed inset-0 bg-black">
      <PlaylistEmbedPlayer result={result} options={options} />
    </main>
  )
}
