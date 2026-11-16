import { LibrariesRepository } from "./repository/libraries.repository"
import { LibraryApiKeysRepository } from "./repository/library-api-keys.repository"
import { VideosRepository } from "./repository/videos.repository"
import { LibrariesService } from "./services/libraries.service"
import { LibraryApiAccessService } from "./services/library-api-access.service"
import { LibraryStorageService } from "./services/library-storage.service"
import { VideoPlaybackService } from "./services/video-playback.service"
import { VideoFilesCleanupService } from "./services/video-files-cleanup.service"
import { VideoProcessingService } from "./services/video-processing.service"
import { VideoStorageService } from "./services/video-storage.service"
import { VideoUploadsService } from "./services/video-uploads.service"
import { VideosService } from "./services/videos.service"
import type { LibraryModuleDependencies } from "./types/libraries.types"

export function createLibrariesModule(dependencies: LibraryModuleDependencies) {
  const {
    db,
    config,
    objectStorage,
    storagesService,
    defaultStorageLocation,
    outboxService,
    webhookEventsService,
    activityLogService,
    storageCleanupService,
    mediaToolkit,
    logger,
  } = dependencies

  const librariesRepository = new LibrariesRepository(db)
  const videosRepository = new VideosRepository(db)
  const libraryApiKeysRepository = new LibraryApiKeysRepository(db)
  const libraryStorageService = new LibraryStorageService(
    librariesRepository,
    storagesService,
    activityLogService,
    defaultStorageLocation
  )
  const videoStorageService = new VideoStorageService(
    objectStorage,
    logger.child("video-storage")
  )
  const videoFilesCleanupService = new VideoFilesCleanupService(
    videosRepository,
    storagesService,
    storageCleanupService
  )

  return {
    librariesService: new LibrariesService(
      librariesRepository,
      activityLogService
    ),
    libraryApiAccessService: new LibraryApiAccessService(
      librariesRepository,
      libraryApiKeysRepository,
      activityLogService,
      config
    ),
    videoPlaybackService: new VideoPlaybackService(
      librariesRepository,
      libraryApiKeysRepository,
      videosRepository,
      libraryStorageService,
      objectStorage,
      logger.child("video-playback"),
      config
    ),
    libraryStorageService,
    videoFilesCleanupService,
    videosService: new VideosService(
      videosRepository,
      videoFilesCleanupService,
      webhookEventsService,
      activityLogService
    ),
    videoUploadsService: new VideoUploadsService(
      videosRepository,
      librariesRepository,
      libraryStorageService,
      videoStorageService,
      outboxService,
      webhookEventsService,
      activityLogService
    ),
    videoProcessingService: new VideoProcessingService(
      videosRepository,
      librariesRepository,
      libraryStorageService,
      objectStorage,
      mediaToolkit,
      outboxService,
      webhookEventsService,
      activityLogService,
      logger.child("video-processing"),
      config
    ),
  }
}

export type LibrariesModule = ReturnType<typeof createLibrariesModule>
