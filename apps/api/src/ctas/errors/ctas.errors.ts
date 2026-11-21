import { DOMAIN_ERROR_KINDS } from "../../common/errors/domain-error.constants"
import type { DomainErrorCatalog } from "../../common/errors/domain-error.types"

export const VIDEO_CTA_ERROR_CODES = {
  NOT_FOUND: "video.cta.not_found",
  OUT_OF_RANGE: "video.cta.out_of_range",
  LIMIT_REACHED: "video.cta.limit_reached",
  END_SCREEN_TAKEN: "video.cta.end_screen_taken",
  NOT_AN_EMAIL_FORM: "video.cta.not_an_email_form",
  LEAD_NOT_FOUND: "video.cta.lead.not_found",
} as const

export const VIDEO_CTA_ERRORS = {
  NOT_FOUND: {
    kind: DOMAIN_ERROR_KINDS.NOT_FOUND,
    code: VIDEO_CTA_ERROR_CODES.NOT_FOUND,
    message: "Call to action not found",
    reason: "video.cta_inaccessible",
  },
  OUT_OF_RANGE: {
    kind: DOMAIN_ERROR_KINDS.INVALID_INPUT,
    code: VIDEO_CTA_ERROR_CODES.OUT_OF_RANGE,
    message:
      "The call to action starts less than a second before the end of the video, or ends after it",
    reason: "video.cta_out_of_range",
  },
  LIMIT_REACHED: {
    kind: DOMAIN_ERROR_KINDS.CONFLICT,
    code: VIDEO_CTA_ERROR_CODES.LIMIT_REACHED,
    message: "The video has as many calls to action as it may have",
    reason: "video.cta_limit_reached",
  },
  END_SCREEN_TAKEN: {
    kind: DOMAIN_ERROR_KINDS.CONFLICT,
    code: VIDEO_CTA_ERROR_CODES.END_SCREEN_TAKEN,
    message: "The video already has an end screen",
    reason: "video.cta_end_screen_taken",
  },
  NOT_AN_EMAIL_FORM: {
    kind: DOMAIN_ERROR_KINDS.INVALID_INPUT,
    code: VIDEO_CTA_ERROR_CODES.NOT_AN_EMAIL_FORM,
    message: "Only an email form takes email addresses",
    reason: "video.cta_not_an_email_form",
  },
  LEAD_NOT_FOUND: {
    kind: DOMAIN_ERROR_KINDS.NOT_FOUND,
    code: VIDEO_CTA_ERROR_CODES.LEAD_NOT_FOUND,
    message: "Lead not found",
    reason: "video.cta_lead_inaccessible",
  },
} as const satisfies DomainErrorCatalog<typeof VIDEO_CTA_ERROR_CODES>
