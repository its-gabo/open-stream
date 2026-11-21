import { TranscriptionProvidersRepository } from "./repository/transcription-providers.repository"
import { VideoCaptionsRepository } from "./repository/video-captions.repository"
import { LibraryTranscriptionSettingsService } from "./services/library-transcription-settings.service"
import { OpenAiCompatibleTranscriptionClientService } from "./services/openai-compatible-transcription-client.service"
import { TranscriptionProvidersService } from "./services/transcription-providers.service"
import { VideoCaptionPlaybackService } from "./services/video-caption-playback.service"
import { VideoCaptionsService } from "./services/video-captions.service"
import { VideoTranscriptionsService } from "./services/video-transcriptions.service"
import type { CaptionsModuleDependencies } from "./types/captions.types"

export function createCaptionsModule({
  db,
  config,
  logger,
  outboxService,
  activityLogService,
  webhookEventsService,
  videoPlaybackService,
  libraryStorageService,
  storageSecretCipherService,
  objectStorage,
  mediaToolkit,
  transcriptionClient = new OpenAiCompatibleTranscriptionClientService(config),
}: CaptionsModuleDependencies) {
  const videoCaptionsRepository = new VideoCaptionsRepository(db)
  const transcriptionProvidersRepository = new TranscriptionProvidersRepository(
    db
  )
  const transcriptionProvidersService = new TranscriptionProvidersService(
    transcriptionProvidersRepository,
    transcriptionClient,
    storageSecretCipherService,
    activityLogService,
    config
  )
  const videoCaptionsService = new VideoCaptionsService(
    videoCaptionsRepository,
    libraryStorageService,
    objectStorage,
    webhookEventsService,
    activityLogService,
    logger.child("captions")
  )

  return {
    transcriptionProvidersService,
    videoCaptionsService,
    libraryTranscriptionSettingsService:
      new LibraryTranscriptionSettingsService(
        videoCaptionsRepository,
        transcriptionProvidersRepository,
        activityLogService
      ),
    videoCaptionPlaybackService: new VideoCaptionPlaybackService(
      videoCaptionsRepository,
      videoCaptionsService,
      videoPlaybackService
    ),
    videoTranscriptionsService: new VideoTranscriptionsService(
      videoCaptionsRepository,
      videoCaptionsService,
      transcriptionProvidersService,
      transcriptionClient,
      libraryStorageService,
      objectStorage,
      mediaToolkit,
      outboxService,
      webhookEventsService,
      activityLogService,
      logger.child("transcription"),
      config
    ),
  }
}

export type CaptionsModule = ReturnType<typeof createCaptionsModule>
