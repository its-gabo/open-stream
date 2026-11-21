import type { z } from "zod"
import type {
  VIDEO_CTA_EVENT_TYPES,
  VIDEO_CTA_KINDS,
  VIDEO_CTA_PLACEMENTS,
  VIDEO_CTA_TIMINGS,
} from "../constants/ctas.constants"
import type {
  videoCtaInputSchema,
  videoCtaLeadInputSchema,
} from "../schemas/ctas.schemas"

type ValueOf<T> = T[keyof T]

export type VideoCtaKind = ValueOf<typeof VIDEO_CTA_KINDS>
export type VideoCtaPlacement = ValueOf<typeof VIDEO_CTA_PLACEMENTS>
export type VideoCtaTiming = ValueOf<typeof VIDEO_CTA_TIMINGS>
export type VideoCtaEventType = ValueOf<typeof VIDEO_CTA_EVENT_TYPES>

export type VideoCtaInput = z.output<typeof videoCtaInputSchema>
export type VideoCtaLeadInput = z.output<typeof videoCtaLeadInputSchema>
