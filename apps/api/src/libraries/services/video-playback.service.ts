import type { Logger } from "../../common/logging/logger"
import { toError } from "../../common/utils/error.utils"
import {
  LIBRARY_API_KEY_SCOPES,
  ORGANIZATION_STATUSES,
  VIDEO_FILE_FORMAT_DETAILS,
  VIDEO_PROCESSING_STATUSES,
  VIDEO_STATUSES,
  videoEmbedPath,
} from "@workspace/shared"
import { DomainError } from "../../common/errors/domain-error"
import { API_BASE_PATH } from "../../common/http/http.constants"
import type { AppConfig } from "../../config/app.config"
import type { LibraryApiKeyRecord, VideoRecord } from "../../db/schema"
import type {
  ObjectStorage,
  StorageByteRange,
} from "../../storage/types/storage.types"
import {
  LIBRARY_API_PATH,
  PLAYBACK_QUERY_KEYS,
  PLAYBACK_EXPIRES_PATTERN,
  TEXT_FILE_EXTENSIONS,
} from "../constants/library-api.constants"
import { VIDEO_DERIVED_FILES } from "../constants/video-processing.constants"
import type { PlaybackUrlCreateBody } from "../dto/libraries.schemas"
import { LIBRARY_ERRORS } from "../errors/libraries.errors"
import type { LibrariesRepository } from "../repository/libraries.repository"
import type { LibraryApiKeysRepository } from "../repository/library-api-keys.repository"
import type { VideosRepository } from "../repository/videos.repository"
import type {
  LibraryProfile,
  PlaybackFile,
  PlaybackRequest,
  VideoStream,
  VideoStreamRequest,
} from "../types/libraries.types"
import {
  BYTE_RANGE_UNSATISFIABLE,
  parseByteRange,
} from "../utils/http-range.utils"
import {
  isPlaybackHostAllowed,
  isSameSecret,
  signPlayback,
  toSignatureQuery,
} from "../utils/library-api.utils"
import {
  appendQueryToReferences,
  derivedFileContentType,
  hlsPrefixOf,
  isHlsFilePath,
  isThumbnailFileName,
  thumbnailsPrefixOf,
} from "../utils/video-files.utils"
import type { LibraryStorageService } from "./library-storage.service"
import { apiKeyIdSchema } from "../dto/libraries.schemas"

/**
 * Serves videos to players: the uploaded file with range requests, and the
 * HLS renditions, poster and storyboard made from it. Each request is
 * checked against the library's playback rules: the page's host must be
 * allowed, and when the library requires it, the URL must carry an
 * unexpired signature, which playlists pass on to the files they list.
 */
export class VideoPlaybackService {
  constructor(
    private readonly librariesRepository: LibrariesRepository,
    private readonly libraryApiKeysRepository: LibraryApiKeysRepository,
    private readonly videosRepository: VideosRepository,
    private readonly libraryStorageService: LibraryStorageService,
    private readonly objectStorage: ObjectStorage,
    private readonly logger: Logger,
    private readonly config: AppConfig
  ) {}

  /** Playback URLs signed with `apiKey`, valid for `expiresInSeconds`; rolling or deleting the key revokes them. */
  async createPlaybackUrl(
    library: LibraryProfile,
    apiKey: LibraryApiKeyRecord,
    videoId: string,
    input: PlaybackUrlCreateBody
  ) {
    const video = await this.videosRepository.findVideo({
      organizationId: library.organizationId,
      libraryId: library.id,
      videoId,
    })

    if (!video) throw new DomainError(LIBRARY_ERRORS.VIDEO_NOT_FOUND)

    const expires = Math.floor(Date.now() / 1000) + input.expiresInSeconds
    const query = new URLSearchParams({
      [PLAYBACK_QUERY_KEYS.KEY_ID]: apiKey.id,
      [PLAYBACK_QUERY_KEYS.EXPIRES]: String(expires),
      [PLAYBACK_QUERY_KEYS.TOKEN]: signPlayback(
        this.config.AUTH_SECRET,
        apiKey.keyHash,
        { libraryId: library.id, videoId: video.id, expires }
      ),
    }).toString()
    const urls = this.toPlaybackUrls(library.id, video.id, query)

    return {
      playback: {
        hlsUrl: urls.hlsUrl,
        originalUrl: urls.originalUrl,
        posterUrl: urls.posterUrl,
        storyboardUrl: urls.storyboardUrl,
        embedUrl: `${this.config.WEB_ORIGIN}${videoEmbedPath(library.id, video.id)}?${query}`,
        expiresAt: new Date(expires * 1000).toISOString(),
      },
    }
  }

  /**
   * What the embeddable player needs to play a processed video. The request
   * comes from the web app's embed page on behalf of the page that frames
   * it, whose host the library's rules are checked against; the URLs carry
   * the embed URL's signature on to the files.
   */
  async getVideoEmbed(request: PlaybackRequest) {
    const { library, video } = await this.authorizePlayback(request)

    if (
      video.processingStatus !== VIDEO_PROCESSING_STATUSES.READY ||
      video.durationSeconds === null ||
      video.width === null ||
      video.height === null
    ) {
      throw new DomainError(LIBRARY_ERRORS.VIDEO_NOT_READY)
    }

    const urls = this.toPlaybackUrls(
      library.id,
      video.id,
      toSignatureQuery(request)
    )

    return {
      embed: {
        videoId: video.id,
        title: video.title,
        durationSeconds: video.durationSeconds,
        width: video.width,
        height: video.height,
        hlsUrl: urls.hlsUrl,
        posterUrl: urls.posterUrl,
        storyboardUrl: urls.storyboardUrl,
        viewsUrl: urls.viewsUrl,
        allowedPlaybackHosts: library.allowedPlaybackHosts,
      },
    }
  }

  /** The library API URLs a player reads, with `query` (a signature, or empty) added to each. */
  private toPlaybackUrls(libraryId: string, videoId: string, query: string) {
    const videoUrl = `${this.config.WEB_ORIGIN}${API_BASE_PATH}${LIBRARY_API_PATH}/${libraryId}/videos/${videoId}`
    const withQuery = (path: string) =>
      query ? `${videoUrl}/${path}?${query}` : `${videoUrl}/${path}`

    return {
      hlsUrl: withQuery(
        `${VIDEO_DERIVED_FILES.HLS_FOLDER}/${VIDEO_DERIVED_FILES.MASTER_PLAYLIST}`
      ),
      originalUrl: withQuery("stream"),
      posterUrl: withQuery(
        `${VIDEO_DERIVED_FILES.THUMBNAILS_FOLDER}/${VIDEO_DERIVED_FILES.POSTER}`
      ),
      storyboardUrl: withQuery(
        `${VIDEO_DERIVED_FILES.THUMBNAILS_FOLDER}/${VIDEO_DERIVED_FILES.STORYBOARD_VTT}`
      ),
      viewsUrl: withQuery("views"),
    }
  }

  /** The uploaded file as it is, or the requested part of it. */
  async openVideoStream(request: VideoStreamRequest): Promise<VideoStream> {
    const { library, video } = await this.authorizePlayback(request)

    if (
      video.status !== VIDEO_STATUSES.UPLOADED ||
      !video.sourceObjectKey ||
      !video.fileFormat ||
      video.sizeBytes === null
    ) {
      throw new DomainError(LIBRARY_ERRORS.VIDEO_NOT_READY)
    }

    const range = parseByteRange(request.rangeHeader, video.sizeBytes)

    if (range === BYTE_RANGE_UNSATISFIABLE) {
      throw new DomainError(LIBRARY_ERRORS.PLAYBACK_RANGE_NOT_SATISFIABLE)
    }

    const body =
      request.includeBody && video.sizeBytes > 0
        ? await this.streamStoredFile(
            library.id,
            video.sourceObjectKey,
            range ?? { start: 0, end: video.sizeBytes - 1 }
          )
        : null

    return {
      contentType: VIDEO_FILE_FORMAT_DETAILS[video.fileFormat].mimeType,
      totalBytes: video.sizeBytes,
      range,
      body,
    }
  }

  /** A playlist or segment below the video's `hls/` folder; playlists pass the request's signature on. */
  async readHlsFile(request: PlaybackRequest, path: string) {
    const { library, video } = await this.authorizePlayback(request)

    return this.readHlsFileOfVideo(
      library.id,
      video,
      path,
      toSignatureQuery(request)
    )
  }

  /** The poster, storyboard image or storyboard WebVTT of a processed video. */
  async readThumbnailFile(request: PlaybackRequest, fileName: string) {
    const { library, video } = await this.authorizePlayback(request)

    return this.readThumbnailOfVideo(
      library.id,
      video,
      fileName,
      toSignatureQuery(request)
    )
  }

  /**
   * For members playing a video in the web app: their membership authorizes
   * them, so the library's playback rules do not apply.
   */
  async readHlsFileForMember(
    library: LibraryProfile,
    videoId: string,
    path: string
  ) {
    return this.readHlsFileOfVideo(
      library.id,
      await this.findMemberVideo(library, videoId),
      path,
      ""
    )
  }

  /** For members in the web app, like `readHlsFileForMember`. */
  async readThumbnailForMember(
    library: LibraryProfile,
    videoId: string,
    fileName: string
  ) {
    return this.readThumbnailOfVideo(
      library.id,
      await this.findMemberVideo(library, videoId),
      fileName,
      ""
    )
  }

  private async findMemberVideo(library: LibraryProfile, videoId: string) {
    const video = await this.videosRepository.findVideo({
      organizationId: library.organizationId,
      libraryId: library.id,
      videoId,
    })

    if (!video) throw new DomainError(LIBRARY_ERRORS.VIDEO_NOT_FOUND)

    return video
  }

  private readHlsFileOfVideo(
    libraryId: string,
    video: VideoRecord,
    path: string,
    signatureQuery: string
  ) {
    const sourceObjectKey = this.readProcessedSource(video)

    if (
      !isHlsFilePath(
        path,
        video.renditions.map(({ quality }) => quality)
      )
    ) {
      throw new DomainError(LIBRARY_ERRORS.PLAYBACK_FILE_NOT_FOUND)
    }

    return this.readDerivedFile(
      libraryId,
      `${hlsPrefixOf(sourceObjectKey)}${path}`,
      signatureQuery
    )
  }

  private readThumbnailOfVideo(
    libraryId: string,
    video: VideoRecord,
    fileName: string,
    signatureQuery: string
  ) {
    const sourceObjectKey = this.readProcessedSource(video)

    if (!isThumbnailFileName(fileName)) {
      throw new DomainError(LIBRARY_ERRORS.PLAYBACK_FILE_NOT_FOUND)
    }

    return this.readDerivedFile(
      libraryId,
      `${thumbnailsPrefixOf(sourceObjectKey)}${fileName}`,
      signatureQuery
    )
  }

  /**
   * Checks the playback rules before anything about the video is revealed;
   * also guards what players report about their viewing.
   */
  async authorizePlayback(request: PlaybackRequest) {
    const library = await this.librariesRepository.findPublicLibrary(
      request.libraryId
    )

    if (
      !library ||
      library.organizationStatus !== ORGANIZATION_STATUSES.ACTIVE
    ) {
      throw new DomainError(LIBRARY_ERRORS.VIDEO_NOT_FOUND)
    }

    this.assertHostAllowed(library, request.requestingHost)

    if (library.requireSignedPlayback) {
      await this.assertPlaybackSigned(library, request)
    }

    const video = await this.videosRepository.findVideo({
      organizationId: library.organizationId,
      libraryId: library.id,
      videoId: request.videoId,
    })

    if (!video) throw new DomainError(LIBRARY_ERRORS.VIDEO_NOT_FOUND)

    return { library, video }
  }

  private readProcessedSource(video: VideoRecord) {
    if (
      video.processingStatus !== VIDEO_PROCESSING_STATUSES.READY ||
      !video.sourceObjectKey
    ) {
      throw new DomainError(LIBRARY_ERRORS.VIDEO_NOT_READY)
    }

    return video.sourceObjectKey
  }

  /**
   * The web app's own host always passes: its embed page checked the host
   * that frames it, and the player inside reads files from the app's origin.
   */
  private assertHostAllowed(
    library: LibraryProfile,
    requestingHost: string | null
  ) {
    if (library.allowedPlaybackHosts.length === 0) return
    if (requestingHost === new URL(this.config.WEB_ORIGIN).host) return

    if (
      !requestingHost ||
      !isPlaybackHostAllowed(requestingHost, library.allowedPlaybackHosts)
    ) {
      throw new DomainError(LIBRARY_ERRORS.PLAYBACK_HOST_NOT_ALLOWED)
    }
  }

  /** The signing key must still exist and still be allowed to sign. */
  private async assertPlaybackSigned(
    library: LibraryProfile,
    { videoId, keyId, expires, token }: PlaybackRequest
  ) {
    const parsedKeyId = apiKeyIdSchema.safeParse(keyId)
    const apiKey = parsedKeyId.success
      ? await this.libraryApiKeysRepository.findApiKey(
          library.id,
          parsedKeyId.data
        )
      : null
    const expiresAt =
      expires && PLAYBACK_EXPIRES_PATTERN.test(expires) ? Number(expires) : 0

    if (
      !apiKey?.scopes.includes(LIBRARY_API_KEY_SCOPES.PLAYBACK_SIGN) ||
      !token ||
      expiresAt * 1000 <= Date.now() ||
      !isSameSecret(
        token,
        signPlayback(this.config.AUTH_SECRET, apiKey.keyHash, {
          libraryId: library.id,
          videoId,
          expires: expiresAt,
        })
      )
    ) {
      throw new DomainError(LIBRARY_ERRORS.PLAYBACK_SIGNATURE_INVALID)
    }
  }

  /** Playlists and WebVTT are read whole to pass the signature on; images and segments are streamed. */
  private async readDerivedFile(
    libraryId: string,
    objectKey: string,
    signatureQuery: string
  ): Promise<PlaybackFile> {
    const contentType = derivedFileContentType(objectKey)
    const stream = await this.streamStoredFile(libraryId, objectKey)

    if (
      !TEXT_FILE_EXTENSIONS.some((extension) => objectKey.endsWith(extension))
    ) {
      return { contentType, body: stream }
    }

    return {
      contentType,
      body: appendQueryToReferences(
        await new Response(stream).text(),
        signatureQuery
      ),
    }
  }

  private async streamStoredFile(
    libraryId: string,
    objectKey: string,
    range?: StorageByteRange
  ) {
    const storage =
      await this.libraryStorageService.resolveLibraryStorage(libraryId)

    try {
      return await this.objectStorage.streamObject(
        storage.location,
        objectKey,
        range
      )
    } catch (error) {
      this.logger.error("Could not read a video file", {
        objectKey,
        error: toError(error),
      })

      throw new DomainError(LIBRARY_ERRORS.STORAGE_UNAVAILABLE)
    }
  }
}
