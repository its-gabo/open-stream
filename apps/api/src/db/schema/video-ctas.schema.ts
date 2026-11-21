import {
  VIDEO_CTA_KINDS,
  VIDEO_CTA_LIMITS,
  VIDEO_CTA_PLACEMENTS,
  VIDEO_CTA_TIMINGS,
  type VideoCtaKind,
  type VideoCtaPlacement,
  type VideoCtaTiming,
} from "@workspace/shared"
import { sql } from "drizzle-orm"
import {
  boolean,
  check,
  doublePrecision,
  foreignKey,
  index,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core"
import { checkOneOf } from "../database.utils"
import { libraries } from "./libraries.schema"
import { users } from "./users.schema"
import { videoViews } from "./video-views.schema"
import { videos } from "./videos.schema"

/** A call to action on a video: a button with a link, or a form asking for an email address. */
export const videoCtas = pgTable(
  "video_ctas",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id").notNull(),
    libraryId: uuid("library_id").notNull(),
    videoId: uuid("video_id").notNull(),
    kind: text("kind", {
      enum: [VIDEO_CTA_KINDS.BUTTON, VIDEO_CTA_KINDS.EMAIL],
    })
      .$type<VideoCtaKind>()
      .notNull(),
    placement: text("placement", {
      enum: [VIDEO_CTA_PLACEMENTS.OVERLAY, VIDEO_CTA_PLACEMENTS.END_SCREEN],
    })
      .$type<VideoCtaPlacement>()
      .notNull(),
    /** When an overlay appears; null for an end screen. */
    startSeconds: doublePrecision("start_seconds"),
    /** When an overlay goes away; null when it stays until the video ends, and for an end screen. */
    endSeconds: doublePrecision("end_seconds"),
    /** A random overlay shows for `durationSeconds` at a moment players pick between its start and end. */
    timing: text("timing", {
      enum: [VIDEO_CTA_TIMINGS.FIXED, VIDEO_CTA_TIMINGS.RANDOM],
    })
      .$type<VideoCtaTiming>()
      .notNull()
      .default(VIDEO_CTA_TIMINGS.FIXED),
    durationSeconds: doublePrecision("duration_seconds"),
    heading: text("heading").notNull(),
    body: text("body"),
    buttonLabel: text("button_label").notNull(),
    /** What a button opens; null for an email form. */
    buttonUrl: text("button_url"),
    /** Shown next to an email form's checkbox; null for a button. */
    consentText: text("consent_text"),
    dismissible: boolean("dismissible").notNull().default(true),
    createdById: uuid("created_by_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    foreignKey({
      name: "video_ctas_video_library_organization_fk",
      columns: [table.videoId, table.libraryId, table.organizationId],
      foreignColumns: [videos.id, videos.libraryId, videos.organizationId],
    }).onDelete("cascade"),
    // Target of the view events foreign key that keeps a view and a call to action on one video.
    unique("video_ctas_id_video_unique").on(table.id, table.videoId),
    checkOneOf(
      "video_ctas_kind_check",
      table.kind,
      Object.values(VIDEO_CTA_KINDS)
    ),
    checkOneOf(
      "video_ctas_placement_check",
      table.placement,
      Object.values(VIDEO_CTA_PLACEMENTS)
    ),
    checkOneOf(
      "video_ctas_timing_check",
      table.timing,
      Object.values(VIDEO_CTA_TIMINGS)
    ),
    check(
      "video_ctas_random_timing_check",
      sql`(${table.timing} = 'random') = (${table.durationSeconds} is not null) and (${table.timing} = 'fixed' or (${table.placement} = 'overlay' and ${table.durationSeconds} >= ${VIDEO_CTA_LIMITS.MIN_LENGTH_SECONDS} and ${table.endSeconds} - ${table.startSeconds} >= ${table.durationSeconds}))`.inlineParams()
    ),
    check(
      "video_ctas_button_check",
      sql`(${table.kind} = 'button') = (${table.buttonUrl} is not null) and ${table.buttonUrl} like 'https://%'`
    ),
    check(
      "video_ctas_consent_text_check",
      sql`(${table.kind} = 'email') = (${table.consentText} is not null) and btrim(${table.consentText}) <> ''`
    ),
    check(
      "video_ctas_times_check",
      sql`case ${table.placement} when 'overlay' then ${table.startSeconds} >= 0 and (${table.endSeconds} is null or ${table.endSeconds} - ${table.startSeconds} >= ${VIDEO_CTA_LIMITS.MIN_LENGTH_SECONDS}) else ${table.startSeconds} is null and ${table.endSeconds} is null end`.inlineParams()
    ),
    check(
      "video_ctas_text_check",
      sql`btrim(${table.heading}) <> '' and btrim(${table.buttonLabel}) <> '' and ${table.body} <> ''`
    ),
    // A video ends once, so it has at most one end screen.
    uniqueIndex("video_ctas_video_id_end_screen_unique")
      .on(table.videoId)
      .where(sql`${table.placement} = 'end_screen'`),
    index("video_ctas_video_id_idx").on(table.videoId),
  ]
)

/** What one view did with one call to action; each moment is kept the first time it happens. */
export const videoViewCtas = pgTable(
  "video_view_ctas",
  {
    viewId: uuid("view_id").notNull(),
    ctaId: uuid("cta_id").notNull(),
    videoId: uuid("video_id").notNull(),
    organizationId: uuid("organization_id").notNull(),
    libraryId: uuid("library_id").notNull(),
    shownAt: timestamp("shown_at", { withTimezone: true }),
    clickedAt: timestamp("clicked_at", { withTimezone: true }),
    dismissedAt: timestamp("dismissed_at", { withTimezone: true }),
    /** When the view left an email address in it. */
    submittedAt: timestamp("submitted_at", { withTimezone: true }),
  },
  (table) => [
    primaryKey({
      name: "video_view_ctas_pk",
      columns: [table.viewId, table.ctaId],
    }),
    // Players report about a view and a call to action of the same video; the API checks the view's.
    foreignKey({
      name: "video_view_ctas_view_fk",
      columns: [table.viewId],
      foreignColumns: [videoViews.id],
    }).onDelete("cascade"),
    foreignKey({
      name: "video_view_ctas_cta_fk",
      columns: [table.ctaId, table.videoId],
      foreignColumns: [videoCtas.id, videoCtas.videoId],
    }).onDelete("cascade"),
    // The library and organization are copied from the video for analytics; this keeps them its own.
    foreignKey({
      name: "video_view_ctas_video_library_organization_fk",
      columns: [table.videoId, table.libraryId, table.organizationId],
      foreignColumns: [videos.id, videos.libraryId, videos.organizationId],
    }).onDelete("cascade"),
    check(
      "video_view_ctas_moment_check",
      sql`coalesce(${table.shownAt}, ${table.clickedAt}, ${table.dismissedAt}, ${table.submittedAt}) is not null`
    ),
    index("video_view_ctas_cta_id_idx").on(table.ctaId),
  ]
)

/**
 * An email address a viewer left in a call to action, with the consent they
 * gave. A lead stays when its call to action, view or video is deleted,
 * keeping their heading and title; only deleting the library removes it.
 */
export const videoCtaLeads = pgTable(
  "video_cta_leads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id").notNull(),
    libraryId: uuid("library_id").notNull(),
    videoId: uuid("video_id").references(() => videos.id, {
      onDelete: "set null",
    }),
    ctaId: uuid("cta_id").references(() => videoCtas.id, {
      onDelete: "set null",
    }),
    viewId: uuid("view_id").references(() => videoViews.id, {
      onDelete: "set null",
    }),
    email: text("email").notNull(),
    /** The consent text exactly as the viewer agreed to it. */
    consentText: text("consent_text").notNull(),
    consentedAt: timestamp("consented_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    /** The call to action's heading and the video's title when the lead was left. */
    ctaHeading: text("cta_heading").notNull(),
    videoTitle: text("video_title").notNull(),
    /** Host of the page the player was embedded on, as the player reported it. */
    embeddingHost: text("embedding_host"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    foreignKey({
      name: "video_cta_leads_library_organization_fk",
      columns: [table.libraryId, table.organizationId],
      foreignColumns: [libraries.id, libraries.organizationId],
    }).onDelete("cascade"),
    // A view leaves one lead per call to action; resending the form changes nothing.
    unique("video_cta_leads_view_id_cta_id_unique").on(
      table.viewId,
      table.ctaId
    ),
    check(
      "video_cta_leads_email_check",
      sql`position('@' in ${table.email}) > 1`
    ),
    check(
      "video_cta_leads_consent_text_check",
      sql`btrim(${table.consentText}) <> ''`
    ),
    index("video_cta_leads_library_id_created_at_idx").on(
      table.libraryId,
      table.createdAt
    ),
    index("video_cta_leads_video_id_idx").on(table.videoId),
    index("video_cta_leads_cta_id_idx").on(table.ctaId),
  ]
)

export type VideoCtaRecord = typeof videoCtas.$inferSelect
export type NewVideoCtaRecord = typeof videoCtas.$inferInsert
export type VideoViewCtaRecord = typeof videoViewCtas.$inferSelect
export type VideoCtaLeadRecord = typeof videoCtaLeads.$inferSelect
export type NewVideoCtaLeadRecord = typeof videoCtaLeads.$inferInsert
