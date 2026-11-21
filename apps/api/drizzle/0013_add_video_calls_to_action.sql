CREATE TABLE "video_cta_leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"library_id" uuid NOT NULL,
	"video_id" uuid,
	"cta_id" uuid,
	"view_id" uuid,
	"email" text NOT NULL,
	"consent_text" text NOT NULL,
	"consented_at" timestamp with time zone DEFAULT now() NOT NULL,
	"cta_heading" text NOT NULL,
	"video_title" text NOT NULL,
	"embedding_host" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "video_cta_leads_view_id_cta_id_unique" UNIQUE("view_id","cta_id"),
	CONSTRAINT "video_cta_leads_email_check" CHECK (position('@' in "video_cta_leads"."email") > 1),
	CONSTRAINT "video_cta_leads_consent_text_check" CHECK (btrim("video_cta_leads"."consent_text") <> '')
);
--> statement-breakpoint
CREATE TABLE "video_ctas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"library_id" uuid NOT NULL,
	"video_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"placement" text NOT NULL,
	"start_seconds" double precision,
	"end_seconds" double precision,
	"timing" text DEFAULT 'fixed' NOT NULL,
	"duration_seconds" double precision,
	"heading" text NOT NULL,
	"body" text,
	"button_label" text NOT NULL,
	"button_url" text,
	"consent_text" text,
	"dismissible" boolean DEFAULT true NOT NULL,
	"created_by_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "video_ctas_id_video_unique" UNIQUE("id","video_id"),
	CONSTRAINT "video_ctas_kind_check" CHECK ("video_ctas"."kind" in ('button', 'email')),
	CONSTRAINT "video_ctas_placement_check" CHECK ("video_ctas"."placement" in ('overlay', 'end_screen')),
	CONSTRAINT "video_ctas_timing_check" CHECK ("video_ctas"."timing" in ('fixed', 'random')),
	CONSTRAINT "video_ctas_random_timing_check" CHECK (("video_ctas"."timing" = 'random') = ("video_ctas"."duration_seconds" is not null) and ("video_ctas"."timing" = 'fixed' or ("video_ctas"."placement" = 'overlay' and "video_ctas"."duration_seconds" >= 1 and "video_ctas"."end_seconds" - "video_ctas"."start_seconds" >= "video_ctas"."duration_seconds"))),
	CONSTRAINT "video_ctas_button_check" CHECK (("video_ctas"."kind" = 'button') = ("video_ctas"."button_url" is not null) and "video_ctas"."button_url" like 'https://%'),
	CONSTRAINT "video_ctas_consent_text_check" CHECK (("video_ctas"."kind" = 'email') = ("video_ctas"."consent_text" is not null) and btrim("video_ctas"."consent_text") <> ''),
	CONSTRAINT "video_ctas_times_check" CHECK (case "video_ctas"."placement" when 'overlay' then "video_ctas"."start_seconds" >= 0 and ("video_ctas"."end_seconds" is null or "video_ctas"."end_seconds" - "video_ctas"."start_seconds" >= 1) else "video_ctas"."start_seconds" is null and "video_ctas"."end_seconds" is null end),
	CONSTRAINT "video_ctas_text_check" CHECK (btrim("video_ctas"."heading") <> '' and btrim("video_ctas"."button_label") <> '' and "video_ctas"."body" <> '')
);
--> statement-breakpoint
CREATE TABLE "video_view_ctas" (
	"view_id" uuid NOT NULL,
	"cta_id" uuid NOT NULL,
	"video_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"library_id" uuid NOT NULL,
	"shown_at" timestamp with time zone,
	"clicked_at" timestamp with time zone,
	"dismissed_at" timestamp with time zone,
	"submitted_at" timestamp with time zone,
	CONSTRAINT "video_view_ctas_pk" PRIMARY KEY("view_id","cta_id"),
	CONSTRAINT "video_view_ctas_moment_check" CHECK (coalesce("video_view_ctas"."shown_at", "video_view_ctas"."clicked_at", "video_view_ctas"."dismissed_at", "video_view_ctas"."submitted_at") is not null)
);
--> statement-breakpoint
ALTER TABLE "activity_logs" DROP CONSTRAINT "activity_logs_action_check";--> statement-breakpoint
ALTER TABLE "activity_logs" DROP CONSTRAINT "activity_logs_resource_type_check";--> statement-breakpoint
ALTER TABLE "library_api_keys" DROP CONSTRAINT "library_api_keys_scopes_check";--> statement-breakpoint
ALTER TABLE "webhook_deliveries" DROP CONSTRAINT "webhook_deliveries_event_type_check";--> statement-breakpoint
ALTER TABLE "video_cta_leads" ADD CONSTRAINT "video_cta_leads_video_id_videos_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."videos"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_cta_leads" ADD CONSTRAINT "video_cta_leads_cta_id_video_ctas_id_fk" FOREIGN KEY ("cta_id") REFERENCES "public"."video_ctas"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_cta_leads" ADD CONSTRAINT "video_cta_leads_view_id_video_views_id_fk" FOREIGN KEY ("view_id") REFERENCES "public"."video_views"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_cta_leads" ADD CONSTRAINT "video_cta_leads_library_organization_fk" FOREIGN KEY ("library_id","organization_id") REFERENCES "public"."libraries"("id","organization_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_ctas" ADD CONSTRAINT "video_ctas_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_ctas" ADD CONSTRAINT "video_ctas_video_library_organization_fk" FOREIGN KEY ("video_id","library_id","organization_id") REFERENCES "public"."videos"("id","library_id","organization_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_view_ctas" ADD CONSTRAINT "video_view_ctas_view_fk" FOREIGN KEY ("view_id") REFERENCES "public"."video_views"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_view_ctas" ADD CONSTRAINT "video_view_ctas_cta_fk" FOREIGN KEY ("cta_id","video_id") REFERENCES "public"."video_ctas"("id","video_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_view_ctas" ADD CONSTRAINT "video_view_ctas_video_library_organization_fk" FOREIGN KEY ("video_id","library_id","organization_id") REFERENCES "public"."videos"("id","library_id","organization_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "video_cta_leads_library_id_created_at_idx" ON "video_cta_leads" USING btree ("library_id","created_at");--> statement-breakpoint
CREATE INDEX "video_cta_leads_video_id_idx" ON "video_cta_leads" USING btree ("video_id");--> statement-breakpoint
CREATE INDEX "video_cta_leads_cta_id_idx" ON "video_cta_leads" USING btree ("cta_id");--> statement-breakpoint
CREATE UNIQUE INDEX "video_ctas_video_id_end_screen_unique" ON "video_ctas" USING btree ("video_id") WHERE "video_ctas"."placement" = 'end_screen';--> statement-breakpoint
CREATE INDEX "video_ctas_video_id_idx" ON "video_ctas" USING btree ("video_id");--> statement-breakpoint
CREATE INDEX "video_view_ctas_cta_id_idx" ON "video_view_ctas" USING btree ("cta_id");--> statement-breakpoint
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_action_check" CHECK ("activity_logs"."action" in ('account.signed_up', 'account.email_verified', 'account.signed_in', 'account.sign_in_failed', 'account.signed_out', 'account.password_reset_requested', 'account.password_reset', 'organization.created', 'organization.updated', 'organization.deletion_scheduled', 'organization.deletion_canceled', 'organization.deleted', 'organization.ownership_transferred', 'invitation.created', 'invitation.resent', 'invitation.canceled', 'invitation.accepted', 'invitation.declined', 'membership.removed', 'membership.left', 'storage.created', 'storage.updated', 'storage.deleted', 'library.created', 'library.updated', 'library.storage_changed', 'library.encoding_updated', 'library.security_updated', 'library.player_updated', 'api_key.created', 'api_key.updated', 'api_key.rolled', 'api_key.deleted', 'webhook.created', 'webhook.updated', 'webhook.deleted', 'webhook.secret_rolled', 'webhook.test_sent', 'webhook.delivery_resent', 'video.created', 'video.updated', 'video.poster_updated', 'video.chapters_updated', 'video.cta_created', 'video.cta_updated', 'video.cta_deleted', 'video.deleted', 'video.uploaded', 'video.upload_canceled', 'video.import_started', 'video.reprocess_requested', 'playlist.created', 'playlist.updated', 'playlist.videos_updated', 'playlist.deleted', 'lead.deleted', 'library.leads_exported'));--> statement-breakpoint
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_resource_type_check" CHECK ("activity_logs"."resource_type" in ('account', 'organization', 'invitation', 'membership', 'storage', 'library', 'api_key', 'webhook', 'video', 'playlist', 'lead'));--> statement-breakpoint
ALTER TABLE "library_api_keys" ADD CONSTRAINT "library_api_keys_scopes_check" CHECK (cardinality("library_api_keys"."scopes") > 0 and "library_api_keys"."scopes" <@ array['videos:read', 'videos:upload', 'videos:manage', 'playback:sign', 'analytics:read', 'leads:read']::text[]);--> statement-breakpoint
ALTER TABLE "webhook_deliveries" ADD CONSTRAINT "webhook_deliveries_event_type_check" CHECK ("webhook_deliveries"."event_type" in ('video.created', 'video.updated', 'video.deleted', 'video.uploaded', 'video.upload_failed', 'video.processing.queued', 'video.processing.started', 'video.processing.ready', 'video.processing.failed', 'video.cta.submitted', 'webhook.test'));