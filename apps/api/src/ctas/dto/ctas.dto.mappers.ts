import type { VideoCtaLeadRecord, VideoCtaRecord } from "../../db/schema"
import type {
  VideoCtaDto,
  VideoCtaLeadDto,
  VideoEmbedCtaDto,
} from "./ctas.schemas"

export const toVideoEmbedCtaDto = (cta: VideoCtaRecord): VideoEmbedCtaDto => ({
  id: cta.id,
  kind: cta.kind,
  placement: cta.placement,
  startSeconds: cta.startSeconds,
  endSeconds: cta.endSeconds,
  timing: cta.timing,
  durationSeconds: cta.durationSeconds,
  heading: cta.heading,
  body: cta.body,
  buttonLabel: cta.buttonLabel,
  buttonUrl: cta.buttonUrl,
  consentText: cta.consentText,
  dismissible: cta.dismissible,
})

export const toVideoCtaDto = (cta: VideoCtaRecord): VideoCtaDto => ({
  ...toVideoEmbedCtaDto(cta),
  videoId: cta.videoId,
  createdAt: cta.createdAt.toISOString(),
  updatedAt: cta.updatedAt.toISOString(),
})

export const toVideoCtaLeadDto = (
  lead: VideoCtaLeadRecord
): VideoCtaLeadDto => ({
  id: lead.id,
  libraryId: lead.libraryId,
  videoId: lead.videoId,
  ctaId: lead.ctaId,
  email: lead.email,
  consentText: lead.consentText,
  consentedAt: lead.consentedAt.toISOString(),
  ctaHeading: lead.ctaHeading,
  videoTitle: lead.videoTitle,
  embeddingHost: lead.embeddingHost,
})
