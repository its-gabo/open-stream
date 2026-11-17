/** The page framing the player, against a library that allows `videos.example.com`. */
export const EMBEDDING_PAGES = [
  {
    description: "an allowed host",
    referer: "https://videos.example.com/watch",
    status: 200,
  },
  {
    description: "another host",
    referer: "https://elsewhere.example.org/",
    status: 403,
  },
  { description: "no Referer", referer: undefined, status: 403 },
] as const
