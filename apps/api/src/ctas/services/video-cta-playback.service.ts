import {
  VIDEO_CTA_KINDS,
  VIDEO_PROCESSING_STATUSES,
  WEBHOOK_EVENT_TYPES,
} from "@workspace/shared"
import { VIEW_REPORT_WINDOW_MS } from "../../analytics/constants/analytics.constants"
import { ANALYTICS_ERRORS } from "../../analytics/errors/analytics.errors"
import { DomainError } from "../../common/errors/domain-error"
import { LIBRARY_ERRORS } from "../../libraries/errors/libraries.errors"
import type { VideoPlaybackService } from "../../libraries/services/video-playback.service"
import type { PlaybackRequest } from "../../libraries/types/libraries.types"
import type { WebhookEventsService } from "../../webhooks/services/webhook-events.service"
import { toVideoCtaLeadDto, toVideoEmbedCtaDto } from "../dto/ctas.dto.mappers"
import type { VideoCtaEventBody, VideoCtaLeadBody } from "../dto/ctas.schemas"
import { VIDEO_VIEW_CTA_MOMENTS } from "../constants/ctas.constants"
import { VIDEO_CTA_ERRORS } from "../errors/ctas.errors"
import type { VideoCtasRepository } from "../repository/video-ctas.repository"

type ViewCtaParams = {
  libraryId: string
  videoId: string
  viewId: string
  ctaId: string
}

/**
 * Serves calls to action to players and records what viewers do with them.
 * Players read them under the library's playback rules; reports and leads
 * name a view, which only the player that started it knows, and which a
 * player can only start under those rules.
 */
export class VideoCtaPlaybackService {
  constructor(
    private readonly videoCtasRepository: VideoCtasRepository,
    private readonly videoPlaybackService: VideoPlaybackService,
    private readonly webhookEventsService: WebhookEventsService
  ) {}

  async listEmbedCtas(request: PlaybackRequest) {
    const { library, video } =
      await this.videoPlaybackService.authorizePlayback(request)

    if (video.processingStatus !== VIDEO_PROCESSING_STATUSES.READY) {
      throw new DomainError(LIBRARY_ERRORS.VIDEO_NOT_READY)
    }

    const ctas = await this.videoCtasRepository.listVideoCtas({
      organizationId: library.organizationId,
      libraryId: library.id,
      videoId: video.id,
    })

    return { ctas: ctas.map(toVideoEmbedCtaDto) }
  }

  /** Each event counts once per view; reporting it again changes nothing. */
  async reportCtaEvent(params: ViewCtaParams, { type }: VideoCtaEventBody) {
    const { view, cta } = await this.findViewCta(params)

    await this.videoCtasRepository.markViewCta(
      {
        viewId: view.id,
        ctaId: cta.id,
        videoId: view.videoId,
        libraryId: view.libraryId,
        organizationId: view.organizationId,
      },
      type
    )

    return {}
  }

  /**
   * Keeps the email address an email form's viewer left, with the consent
   * text they agreed to, and tells the library's webhook. A view leaves one
   * lead per call to action; sending the form again changes nothing.
   */
  async submitLead(params: ViewCtaParams, input: VideoCtaLeadBody) {
    const { view, cta } = await this.findViewCta(params)

    if (cta.kind !== VIDEO_CTA_KINDS.EMAIL || !cta.consentText) {
      throw new DomainError(VIDEO_CTA_ERRORS.NOT_AN_EMAIL_FORM)
    }

    const consentText = cta.consentText

    await this.videoCtasRepository.transaction(async (transaction) => {
      const lead = await this.videoCtasRepository.insertLead(
        {
          organizationId: view.organizationId,
          libraryId: view.libraryId,
          videoId: view.videoId,
          ctaId: cta.id,
          viewId: view.id,
          email: input.email,
          consentText,
          ctaHeading: cta.heading,
          videoTitle: view.videoTitle,
          embeddingHost: view.embeddingHost,
        },
        transaction
      )

      if (!lead) return

      await this.videoCtasRepository.markViewCta(
        {
          viewId: view.id,
          ctaId: cta.id,
          videoId: view.videoId,
          libraryId: view.libraryId,
          organizationId: view.organizationId,
        },
        VIDEO_VIEW_CTA_MOMENTS.SUBMITTED,
        transaction
      )
      await this.webhookEventsService.publishEvent(
        view.libraryId,
        {
          type: WEBHOOK_EVENT_TYPES.VIDEO_CTA_SUBMITTED,
          data: toVideoCtaLeadDto(lead),
        },
        transaction
      )
    })

    return {}
  }

  private async findViewCta({
    libraryId,
    videoId,
    viewId,
    ctaId,
  }: ViewCtaParams) {
    const view = await this.videoCtasRepository.findReportableView(
      { libraryId, videoId, viewId },
      new Date(Date.now() - VIEW_REPORT_WINDOW_MS)
    )

    if (!view) throw new DomainError(ANALYTICS_ERRORS.VIEW_NOT_FOUND)

    const cta = await this.videoCtasRepository.findVideoCta({
      organizationId: view.organizationId,
      libraryId: view.libraryId,
      videoId: view.videoId,
      ctaId,
    })

    if (!cta) throw new DomainError(VIDEO_CTA_ERRORS.NOT_FOUND)

    return { view, cta }
  }
}
