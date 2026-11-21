CREATE TABLE "chapter_generation_providers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"kind" text NOT NULL,
	"base_url" text,
	"model" text NOT NULL,
	"api_key_hint" text,
	"api_key" jsonb,
	"monthly_token_limit" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chapter_generation_providers_id_organization_unique" UNIQUE("id","organization_id"),
	CONSTRAINT "chapter_generation_providers_kind_check" CHECK ("chapter_generation_providers"."kind" in ('openai', 'openai_compatible')),
	CONSTRAINT "chapter_generation_providers_name_check" CHECK (btrim("chapter_generation_providers"."name") <> '' and btrim("chapter_generation_providers"."model") <> ''),
	CONSTRAINT "chapter_generation_providers_base_url_check" CHECK (("chapter_generation_providers"."kind" = 'openai') = ("chapter_generation_providers"."base_url" is null)),
	CONSTRAINT "chapter_generation_providers_api_key_check" CHECK (("chapter_generation_providers"."api_key_hint" is null) = ("chapter_generation_providers"."api_key" is null) and ("chapter_generation_providers"."kind" <> 'openai' or "chapter_generation_providers"."api_key" is not null)),
	CONSTRAINT "chapter_generation_providers_monthly_token_limit_check" CHECK ("chapter_generation_providers"."monthly_token_limit" is null or "chapter_generation_providers"."monthly_token_limit" > 0)
);
--> statement-breakpoint
CREATE TABLE "chapter_generation_usages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"provider_id" uuid NOT NULL,
	"video_id" uuid NOT NULL,
	"requested_by_id" uuid,
	"model" text NOT NULL,
	"tokens" integer NOT NULL,
	"finished_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chapter_generation_usages_tokens_check" CHECK ("chapter_generation_usages"."tokens" >= 0)
);
--> statement-breakpoint
ALTER TABLE "activity_logs" DROP CONSTRAINT "activity_logs_action_check";--> statement-breakpoint
ALTER TABLE "activity_logs" DROP CONSTRAINT "activity_logs_resource_type_check";--> statement-breakpoint
ALTER TABLE "video_transcriptions" DROP CONSTRAINT "video_transcriptions_failure_reason_value_check";--> statement-breakpoint
ALTER TABLE "libraries" ADD COLUMN "chapter_generation_provider_id" uuid;--> statement-breakpoint
ALTER TABLE "transcription_providers" ADD COLUMN "monthly_minute_limit" integer;--> statement-breakpoint
ALTER TABLE "video_transcriptions" ADD COLUMN "audio_seconds" double precision DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "video_transcriptions" ADD COLUMN "transcribed_audio_seconds" double precision DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "chapter_generation_providers" ADD CONSTRAINT "chapter_generation_providers_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chapter_generation_usages" ADD CONSTRAINT "chapter_generation_usages_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chapter_generation_usages" ADD CONSTRAINT "chapter_generation_usages_provider_id_chapter_generation_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."chapter_generation_providers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chapter_generation_usages" ADD CONSTRAINT "chapter_generation_usages_requested_by_id_users_id_fk" FOREIGN KEY ("requested_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "chapter_generation_providers_organization_id_idx" ON "chapter_generation_providers" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "chapter_generation_usages_provider_id_created_at_idx" ON "chapter_generation_usages" USING btree ("provider_id","created_at");--> statement-breakpoint
CREATE INDEX "chapter_generation_usages_organization_id_idx" ON "chapter_generation_usages" USING btree ("organization_id");--> statement-breakpoint
ALTER TABLE "libraries" ADD CONSTRAINT "libraries_chapter_generation_provider_organization_fk" FOREIGN KEY ("chapter_generation_provider_id","organization_id") REFERENCES "public"."chapter_generation_providers"("id","organization_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "libraries_chapter_generation_provider_id_idx" ON "libraries" USING btree ("chapter_generation_provider_id");--> statement-breakpoint
CREATE INDEX "video_transcriptions_provider_id_created_at_idx" ON "video_transcriptions" USING btree ("provider_id","created_at");--> statement-breakpoint
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_action_check" CHECK ("activity_logs"."action" in ('account.signed_up', 'account.email_verified', 'account.signed_in', 'account.sign_in_failed', 'account.signed_out', 'account.password_reset_requested', 'account.password_reset', 'organization.created', 'organization.updated', 'organization.deletion_scheduled', 'organization.deletion_canceled', 'organization.deleted', 'organization.ownership_transferred', 'invitation.created', 'invitation.resent', 'invitation.canceled', 'invitation.accepted', 'invitation.declined', 'membership.removed', 'membership.left', 'storage.created', 'storage.updated', 'storage.deleted', 'transcription_provider.created', 'transcription_provider.updated', 'transcription_provider.deleted', 'chapter_generation_provider.created', 'chapter_generation_provider.updated', 'chapter_generation_provider.deleted', 'library.created', 'library.updated', 'library.storage_changed', 'library.encoding_updated', 'library.security_updated', 'library.player_updated', 'library.transcription_updated', 'library.chapter_generation_updated', 'api_key.created', 'api_key.updated', 'api_key.rolled', 'api_key.deleted', 'webhook.created', 'webhook.updated', 'webhook.deleted', 'webhook.secret_rolled', 'webhook.test_sent', 'webhook.delivery_resent', 'video.created', 'video.updated', 'video.poster_updated', 'video.chapters_updated', 'video.cta_created', 'video.cta_updated', 'video.cta_deleted', 'video.caption_uploaded', 'video.caption_updated', 'video.caption_deleted', 'video.transcription_requested', 'video.deleted', 'video.uploaded', 'video.upload_canceled', 'video.import_started', 'video.reprocess_requested', 'playlist.created', 'playlist.updated', 'playlist.videos_updated', 'playlist.deleted', 'lead.deleted', 'library.leads_exported'));--> statement-breakpoint
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_resource_type_check" CHECK ("activity_logs"."resource_type" in ('account', 'organization', 'invitation', 'membership', 'storage', 'transcription_provider', 'chapter_generation_provider', 'library', 'api_key', 'webhook', 'video', 'playlist', 'lead'));--> statement-breakpoint
ALTER TABLE "transcription_providers" ADD CONSTRAINT "transcription_providers_monthly_minute_limit_check" CHECK ("transcription_providers"."monthly_minute_limit" is null or "transcription_providers"."monthly_minute_limit" > 0);--> statement-breakpoint
ALTER TABLE "video_transcriptions" ADD CONSTRAINT "video_transcriptions_audio_seconds_check" CHECK ("video_transcriptions"."audio_seconds" >= 0 and "video_transcriptions"."transcribed_audio_seconds" >= 0);--> statement-breakpoint
ALTER TABLE "video_transcriptions" ADD CONSTRAINT "video_transcriptions_failure_reason_value_check" CHECK ("video_transcriptions"."failure_reason" in ('provider_auth', 'provider_rejected', 'provider_unreachable', 'provider_removed', 'no_audio', 'no_speech', 'usage_limit_reached', 'transcription_failed'));