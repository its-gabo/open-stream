import { ACTIVITY_RESOURCE_TYPES } from "@workspace/shared"
import type { ActivityResource } from "../../activity/types/activity.types"
import type { VideoCtaLeadRecord, VideoCtaRecord } from "../../db/schema"

/** What the activity log keeps of a call to action; its id goes in the context. */
export const toVideoCtaActivityValues = (cta: VideoCtaRecord) => ({
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

/** Labeled by the heading it was left in: the email address must not outlive the lead in the log. */
export const leadActivityResource = (
  lead: Pick<VideoCtaLeadRecord, "id" | "ctaHeading">
): ActivityResource => ({
  type: ACTIVITY_RESOURCE_TYPES.LEAD,
  id: lead.id,
  label: lead.ctaHeading,
})
