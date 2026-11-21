/** A video's calls to action as its embed reads them; the URL names the video and carries its signature. */
export const embedCtasQueryKey = (ctasUrl: string) =>
  ["embed", "ctas", ctasUrl] as const

/** A video's caption tracks as its embed reads them; the URL names the video and carries its signature. */
export const embedCaptionsQueryKey = (captionsUrl: string) =>
  ["embed", "captions", captionsUrl] as const
