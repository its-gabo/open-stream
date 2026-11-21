import { VIDEO_TRANSCRIPTION_STATUSES } from "@workspace/shared"
import { and, eq } from "drizzle-orm"
import { videoCaptions, videoTranscriptions } from "../../db/schema"
import type { VideoScope } from "../../libraries/types/libraries.types"
import type { VideoCaptionScope } from "../types/captions.types"

/** A transcription still waiting or running; a video has one at most. */
export const activeTranscriptionStatuses = [
  VIDEO_TRANSCRIPTION_STATUSES.PENDING,
  VIDEO_TRANSCRIPTION_STATUSES.PROCESSING,
]

export const videoCaptionsOfVideo = ({
  organizationId,
  libraryId,
  videoId,
}: VideoScope) =>
  and(
    eq(videoCaptions.organizationId, organizationId),
    eq(videoCaptions.libraryId, libraryId),
    eq(videoCaptions.videoId, videoId)
  )

export const videoCaptionInScope = ({
  captionId,
  ...video
}: VideoCaptionScope) =>
  and(videoCaptionsOfVideo(video), eq(videoCaptions.id, captionId))

/** The transcription while run `runId` holds it. */
export const transcriptionRunCondition = (
  transcriptionId: string,
  runId: string
) =>
  and(
    eq(videoTranscriptions.id, transcriptionId),
    eq(videoTranscriptions.status, VIDEO_TRANSCRIPTION_STATUSES.PROCESSING),
    eq(videoTranscriptions.runId, runId)
  )
