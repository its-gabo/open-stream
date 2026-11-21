/** A video's calls to action as its embed reads them; the URL names the video and carries its signature. */
export const embedCtasQueryKey = (ctasUrl: string) =>
  ["embed", "ctas", ctasUrl] as const
