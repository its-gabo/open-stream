import { VIDEO_EMBED_QUERY_KEYS } from "@workspace/shared"
import { z } from "zod"

/** `1`, `true` or their string forms; the router parses `?autoplay=1` as a number. */
const embedFlagSchema = z.preprocess(
  (value) =>
    value === undefined
      ? undefined
      : [1, true, "1", "true"].includes(value as never),
  z.boolean().optional()
)

/** A signed URL's parts, kept as strings although the router may parse them as numbers. */
const signaturePartSchema = z.coerce.string().optional().catch(undefined)

export const videoEmbedSearchSchema = z.object({
  [VIDEO_EMBED_QUERY_KEYS.AUTOPLAY]: embedFlagSchema,
  [VIDEO_EMBED_QUERY_KEYS.MUTED]: embedFlagSchema,
  [VIDEO_EMBED_QUERY_KEYS.LOOP]: embedFlagSchema,
  [VIDEO_EMBED_QUERY_KEYS.START]: z.coerce
    .number()
    .nonnegative()
    .optional()
    .catch(undefined),
  [VIDEO_EMBED_QUERY_KEYS.TITLE]: embedFlagSchema,
  key: signaturePartSchema,
  expires: signaturePartSchema,
  token: signaturePartSchema,
})

export const videoEmbedRequestSchema = z.object({
  libraryId: z.string(),
  videoId: z.string(),
  key: z.string().optional(),
  expires: z.string().optional(),
  token: z.string().optional(),
})

export type VideoEmbedSearch = z.infer<typeof videoEmbedSearchSchema>
export type VideoEmbedRequest = z.infer<typeof videoEmbedRequestSchema>
