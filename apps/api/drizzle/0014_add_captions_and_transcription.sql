CREATE TABLE "transcription_providers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"kind" text NOT NULL,
	"base_url" text,
	"model" text NOT NULL,
	"api_key_hint" text,
	"api_key" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "transcription_providers_id_organization_unique" UNIQUE("id","organization_id"),
	CONSTRAINT "transcription_providers_kind_check" CHECK ("transcription_providers"."kind" in ('openai', 'openai_compatible')),
	CONSTRAINT "transcription_providers_name_check" CHECK (btrim("transcription_providers"."name") <> '' and btrim("transcription_providers"."model") <> ''),
	CONSTRAINT "transcription_providers_base_url_check" CHECK (("transcription_providers"."kind" = 'openai') = ("transcription_providers"."base_url" is null)),
	CONSTRAINT "transcription_providers_api_key_check" CHECK (("transcription_providers"."api_key_hint" is null) = ("transcription_providers"."api_key" is null) and ("transcription_providers"."kind" <> 'openai' or "transcription_providers"."api_key" is not null))
);
--> statement-breakpoint
CREATE TABLE "video_captions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"library_id" uuid NOT NULL,
	"video_id" uuid NOT NULL,
	"language" text NOT NULL,
	"label" text NOT NULL,
	"kind" text NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"object_key" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"cue_count" integer NOT NULL,
	"transcription_id" uuid,
	"created_by_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "video_captions_transcription_id_unique" UNIQUE("transcription_id"),
	CONSTRAINT "video_captions_kind_check" CHECK ("video_captions"."kind" in ('subtitles', 'captions')),
	CONSTRAINT "video_captions_label_check" CHECK (btrim("video_captions"."label") <> ''),
	CONSTRAINT "video_captions_file_check" CHECK ("video_captions"."size_bytes" > 0 and "video_captions"."cue_count" > 0)
);
--> statement-breakpoint
CREATE TABLE "video_transcriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"library_id" uuid NOT NULL,
	"video_id" uuid NOT NULL,
	"provider_id" uuid,
	"model" text NOT NULL,
	"language" text,
	"detected_language" text,
	"kind" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"failure_reason" text,
	"run_id" uuid,
	"heartbeat_at" timestamp with time zone,
	"created_by_id" uuid,
	"finished_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "video_transcriptions_kind_check" CHECK ("video_transcriptions"."kind" in ('subtitles', 'captions')),
	CONSTRAINT "video_transcriptions_status_check" CHECK ("video_transcriptions"."status" in ('pending', 'processing', 'succeeded', 'failed')),
	CONSTRAINT "video_transcriptions_failure_reason_value_check" CHECK ("video_transcriptions"."failure_reason" in ('provider_auth', 'provider_rejected', 'provider_unreachable', 'provider_removed', 'no_audio', 'no_speech', 'transcription_failed')),
	CONSTRAINT "video_transcriptions_failure_reason_check" CHECK (("video_transcriptions"."status" = 'failed') = ("video_transcriptions"."failure_reason" is not null)),
	CONSTRAINT "video_transcriptions_finished_at_check" CHECK (("video_transcriptions"."status" in ('succeeded', 'failed')) = ("video_transcriptions"."finished_at" is not null)),
	CONSTRAINT "video_transcriptions_run_check" CHECK (("video_transcriptions"."run_id" is null and "video_transcriptions"."heartbeat_at" is null) or "video_transcriptions"."status" = 'processing'),
	CONSTRAINT "video_transcriptions_model_check" CHECK (btrim("video_transcriptions"."model") <> '')
);
--> statement-breakpoint
ALTER TABLE "activity_logs" DROP CONSTRAINT "activity_logs_action_check";--> statement-breakpoint
ALTER TABLE "activity_logs" DROP CONSTRAINT "activity_logs_resource_type_check";--> statement-breakpoint
ALTER TABLE "webhook_deliveries" DROP CONSTRAINT "webhook_deliveries_event_type_check";--> statement-breakpoint
ALTER TABLE "outbox_messages" DROP CONSTRAINT "outbox_messages_type_check";--> statement-breakpoint
ALTER TABLE "libraries" ALTER COLUMN "player_settings" SET DEFAULT '{"accentColor":"#ffffff","showTitle":true,"showSettingsMenu":true,"showPictureInPicture":true,"showFullscreen":true,"showChapters":true,"showCaptions":true,"autoplayNext":true}'::jsonb;--> statement-breakpoint
ALTER TABLE "libraries" ADD COLUMN "transcription_provider_id" uuid;--> statement-breakpoint
ALTER TABLE "libraries" ADD COLUMN "auto_transcribe" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "libraries" ADD COLUMN "transcription_language" text;--> statement-breakpoint
ALTER TABLE "transcription_providers" ADD CONSTRAINT "transcription_providers_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_captions" ADD CONSTRAINT "video_captions_transcription_id_video_transcriptions_id_fk" FOREIGN KEY ("transcription_id") REFERENCES "public"."video_transcriptions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_captions" ADD CONSTRAINT "video_captions_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_captions" ADD CONSTRAINT "video_captions_video_library_organization_fk" FOREIGN KEY ("video_id","library_id","organization_id") REFERENCES "public"."videos"("id","library_id","organization_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_transcriptions" ADD CONSTRAINT "video_transcriptions_provider_id_transcription_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."transcription_providers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_transcriptions" ADD CONSTRAINT "video_transcriptions_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_transcriptions" ADD CONSTRAINT "video_transcriptions_video_library_organization_fk" FOREIGN KEY ("video_id","library_id","organization_id") REFERENCES "public"."videos"("id","library_id","organization_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "transcription_providers_organization_id_idx" ON "transcription_providers" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "video_captions_video_language_kind_unique" ON "video_captions" USING btree ("video_id","language","kind");--> statement-breakpoint
CREATE UNIQUE INDEX "video_captions_video_id_default_unique" ON "video_captions" USING btree ("video_id") WHERE "video_captions"."is_default";--> statement-breakpoint
CREATE INDEX "video_captions_library_id_idx" ON "video_captions" USING btree ("library_id");--> statement-breakpoint
CREATE UNIQUE INDEX "video_transcriptions_video_id_active_unique" ON "video_transcriptions" USING btree ("video_id") WHERE "video_transcriptions"."status" in ('pending', 'processing');--> statement-breakpoint
CREATE INDEX "video_transcriptions_video_id_created_at_idx" ON "video_transcriptions" USING btree ("video_id","created_at");--> statement-breakpoint
CREATE INDEX "video_transcriptions_active_idx" ON "video_transcriptions" USING btree ("status") WHERE "video_transcriptions"."status" in ('pending', 'processing');--> statement-breakpoint
ALTER TABLE "libraries" ADD CONSTRAINT "libraries_transcription_provider_organization_fk" FOREIGN KEY ("transcription_provider_id","organization_id") REFERENCES "public"."transcription_providers"("id","organization_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "libraries_transcription_provider_id_idx" ON "libraries" USING btree ("transcription_provider_id");--> statement-breakpoint
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_action_check" CHECK ("activity_logs"."action" in ('account.signed_up', 'account.email_verified', 'account.signed_in', 'account.sign_in_failed', 'account.signed_out', 'account.password_reset_requested', 'account.password_reset', 'organization.created', 'organization.updated', 'organization.deletion_scheduled', 'organization.deletion_canceled', 'organization.deleted', 'organization.ownership_transferred', 'invitation.created', 'invitation.resent', 'invitation.canceled', 'invitation.accepted', 'invitation.declined', 'membership.removed', 'membership.left', 'storage.created', 'storage.updated', 'storage.deleted', 'transcription_provider.created', 'transcription_provider.updated', 'transcription_provider.deleted', 'library.created', 'library.updated', 'library.storage_changed', 'library.encoding_updated', 'library.security_updated', 'library.player_updated', 'library.transcription_updated', 'api_key.created', 'api_key.updated', 'api_key.rolled', 'api_key.deleted', 'webhook.created', 'webhook.updated', 'webhook.deleted', 'webhook.secret_rolled', 'webhook.test_sent', 'webhook.delivery_resent', 'video.created', 'video.updated', 'video.poster_updated', 'video.chapters_updated', 'video.cta_created', 'video.cta_updated', 'video.cta_deleted', 'video.caption_uploaded', 'video.caption_updated', 'video.caption_deleted', 'video.transcription_requested', 'video.deleted', 'video.uploaded', 'video.upload_canceled', 'video.import_started', 'video.reprocess_requested', 'playlist.created', 'playlist.updated', 'playlist.videos_updated', 'playlist.deleted', 'lead.deleted', 'library.leads_exported'));--> statement-breakpoint
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_resource_type_check" CHECK ("activity_logs"."resource_type" in ('account', 'organization', 'invitation', 'membership', 'storage', 'transcription_provider', 'library', 'api_key', 'webhook', 'video', 'playlist', 'lead'));--> statement-breakpoint
ALTER TABLE "libraries" ADD CONSTRAINT "libraries_auto_transcribe_check" CHECK (not "libraries"."auto_transcribe" or "libraries"."transcription_provider_id" is not null);--> statement-breakpoint
ALTER TABLE "webhook_deliveries" ADD CONSTRAINT "webhook_deliveries_event_type_check" CHECK ("webhook_deliveries"."event_type" in ('video.created', 'video.updated', 'video.deleted', 'video.uploaded', 'video.upload_failed', 'video.processing.queued', 'video.processing.started', 'video.processing.ready', 'video.processing.failed', 'video.caption.ready', 'video.caption.deleted', 'video.transcription.failed', 'video.cta.submitted', 'webhook.test'));--> statement-breakpoint
ALTER TABLE "outbox_messages" ADD CONSTRAINT "outbox_messages_type_check" CHECK ("outbox_messages"."type" in ('email.send', 'video.process', 'video.import', 'video.processed', 'video.transcribe', 'webhook.deliver', 'storage.clean_up'));