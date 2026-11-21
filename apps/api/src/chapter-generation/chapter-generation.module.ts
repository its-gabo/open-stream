import { ChapterGenerationProvidersRepository } from "./repository/chapter-generation-providers.repository"
import { AiSdkChapterGenerationClientService } from "./services/ai-sdk-chapter-generation-client.service"
import { ChapterGenerationProvidersService } from "./services/chapter-generation-providers.service"
import { LibraryChapterGenerationSettingsService } from "./services/library-chapter-generation-settings.service"
import { VideoChapterSuggestionsService } from "./services/video-chapter-suggestions.service"
import type { ChapterGenerationModuleDependencies } from "./types/chapter-generation.types"

export function createChapterGenerationModule({
  db,
  config,
  logger,
  activityLogService,
  storageSecretCipherService,
  videoCaptionsService,
  chapterGenerationClient = new AiSdkChapterGenerationClientService(config),
}: ChapterGenerationModuleDependencies) {
  const chapterGenerationProvidersRepository =
    new ChapterGenerationProvidersRepository(db)
  const chapterGenerationProvidersService =
    new ChapterGenerationProvidersService(
      chapterGenerationProvidersRepository,
      chapterGenerationClient,
      storageSecretCipherService,
      activityLogService,
      config
    )

  return {
    chapterGenerationProvidersService,
    libraryChapterGenerationSettingsService:
      new LibraryChapterGenerationSettingsService(
        chapterGenerationProvidersRepository,
        activityLogService
      ),
    videoChapterSuggestionsService: new VideoChapterSuggestionsService(
      chapterGenerationProvidersRepository,
      chapterGenerationProvidersService,
      chapterGenerationClient,
      videoCaptionsService,
      logger.child("chapter-generation")
    ),
  }
}

export type ChapterGenerationModule = ReturnType<
  typeof createChapterGenerationModule
>
