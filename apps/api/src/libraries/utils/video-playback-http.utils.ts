import type { HonoRequest } from "hono"
import { PLAYBACK_HEADERS } from "../constants/library-api.constants"
import type {
  PlaybackFile,
  PlaybackRequest,
  VideoStream,
} from "../types/libraries.types"
import { readRequestingHost } from "./library-api.utils"

export const toStreamHeaders = ({
  contentType,
  totalBytes,
  range,
}: VideoStream) => ({
  ...PLAYBACK_HEADERS,
  "Content-Type": contentType,
  "Content-Length": String(range ? range.end - range.start + 1 : totalBytes),
  "Accept-Ranges": "bytes",
  ...(range && {
    "Content-Range": `bytes ${range.start}-${range.end}/${totalBytes}`,
  }),
})

export const toFileResponse = ({ contentType, body }: PlaybackFile) =>
  new Response(body, {
    status: 200,
    headers: { ...PLAYBACK_HEADERS, "Content-Type": contentType },
  })

/** Who asks for a video and with which signature, read from the request. */
export const toPlaybackRequest = (
  request: HonoRequest,
  { libraryId, videoId }: { libraryId: string; videoId: string }
): PlaybackRequest => ({
  libraryId,
  videoId,
  keyId: request.query("key"),
  expires: request.query("expires"),
  token: request.query("token"),
  requestingHost: readRequestingHost(
    request.header("origin"),
    request.header("referer")
  ),
})
