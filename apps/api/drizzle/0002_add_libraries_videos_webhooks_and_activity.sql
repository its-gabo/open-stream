CREATE TABLE "activity_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid,
	"account_user_id" uuid,
	"actor_kind" text NOT NULL,
	"actor_user_id" uuid,
	"actor_api_key_id" uuid,
	"actor_label" text NOT NULL,
	"action" text NOT NULL,
	"resource_type" text NOT NULL,
	"resource_id" text,
	"resource_label" text,
	"before" jsonb,
	"after" jsonb,
	"context" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "libraries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"storage_id" uuid,
	"allowed_playback_hosts" text[] DEFAULT '{}' NOT NULL,
	"transcode_qualities" text[] DEFAULT '{"360p","480p","720p","1080p"}' NOT NULL,
	"require_signed_playback" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "libraries_id_organization_unique" UNIQUE("id","organization_id")
);
--> statement-breakpoint
CREATE TABLE "library_api_keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"library_id" uuid NOT NULL,
	"name" text NOT NULL,
	"key_hash" text NOT NULL,
	"key_hint" text NOT NULL,
	"scopes" text[] NOT NULL,
	"last_used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "library_api_keys_key_hash_unique" UNIQUE("key_hash")
);
--> statement-breakpoint
CREATE TABLE "library_webhooks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"library_id" uuid NOT NULL,
	"url" text NOT NULL,
	"signing_secret" jsonb NOT NULL,
	"signing_secret_hint" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "library_webhooks_library_id_unique" UNIQUE("library_id")
);
--> statement-breakpoint
CREATE TABLE "webhook_deliveries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"webhook_id" uuid NOT NULL,
	"event_type" text NOT NULL,
	"payload" jsonb NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"response_status" integer,
	"last_error" text,
	"last_attempt_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "storage_cleanups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"location" jsonb,
	"object_keys" text[] DEFAULT '{}' NOT NULL,
	"prefixes" text[] DEFAULT '{}' NOT NULL,
	"multipart_uploads" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"last_error" text,
	"last_attempt_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "storages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"endpoint" text NOT NULL,
	"region" text NOT NULL,
	"bucket" text NOT NULL,
	"force_path_style" boolean NOT NULL,
	"path_template" text NOT NULL,
	"access_key_id_hint" text NOT NULL,
	"credentials_ciphertext" text NOT NULL,
	"credentials_iv" text NOT NULL,
	"credentials_tag" text NOT NULL,
	"credentials_encrypted_key" text NOT NULL,
	"credentials_key_iv" text NOT NULL,
	"credentials_key_tag" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "storages_id_organization_unique" UNIQUE("id","organization_id")
);
--> statement-breakpoint
CREATE TABLE "video_uploads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"video_id" uuid NOT NULL,
	"object_key" text NOT NULL,
	"multipart_upload_id" text NOT NULL,
	"upload_length" bigint NOT NULL,
	"upload_offset" bigint DEFAULT 0 NOT NULL,
	"next_part_number" integer DEFAULT 1 NOT NULL,
	"parts" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "video_uploads_video_id_unique" UNIQUE("video_id")
);
--> statement-breakpoint
CREATE TABLE "videos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"library_id" uuid NOT NULL,
	"title" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"failure_reason" text,
	"file_name" text,
	"file_format" text,
	"size_bytes" bigint,
	"uploaded_bytes" bigint DEFAULT 0 NOT NULL,
	"source_object_key" text,
	"created_by_id" uuid,
	"uploaded_at" timestamp with time zone,
	"processing_status" text,
	"processing_failure_reason" text,
	"processing_run_id" uuid,
	"processing_heartbeat_at" timestamp with time zone,
	"duration_seconds" double precision,
	"width" integer,
	"height" integer,
	"video_codec" text,
	"audio_codec" text,
	"renditions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"processed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_account_user_id_users_id_fk" FOREIGN KEY ("account_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "libraries" ADD CONSTRAINT "libraries_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "libraries" ADD CONSTRAINT "libraries_storage_organization_fk" FOREIGN KEY ("storage_id","organization_id") REFERENCES "public"."storages"("id","organization_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "library_api_keys" ADD CONSTRAINT "library_api_keys_library_id_libraries_id_fk" FOREIGN KEY ("library_id") REFERENCES "public"."libraries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "library_webhooks" ADD CONSTRAINT "library_webhooks_library_id_libraries_id_fk" FOREIGN KEY ("library_id") REFERENCES "public"."libraries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_deliveries" ADD CONSTRAINT "webhook_deliveries_webhook_id_library_webhooks_id_fk" FOREIGN KEY ("webhook_id") REFERENCES "public"."library_webhooks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "storages" ADD CONSTRAINT "storages_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_uploads" ADD CONSTRAINT "video_uploads_video_id_videos_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."videos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "videos" ADD CONSTRAINT "videos_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "videos" ADD CONSTRAINT "videos_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "videos" ADD CONSTRAINT "videos_library_organization_fk" FOREIGN KEY ("library_id","organization_id") REFERENCES "public"."libraries"("id","organization_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "activity_logs_organization_id_created_at_idx" ON "activity_logs" USING btree ("organization_id","created_at");--> statement-breakpoint
CREATE INDEX "activity_logs_organization_id_resource_idx" ON "activity_logs" USING btree ("organization_id","resource_type","resource_id");--> statement-breakpoint
CREATE INDEX "activity_logs_actor_user_id_idx" ON "activity_logs" USING btree ("actor_user_id");--> statement-breakpoint
CREATE INDEX "activity_logs_account_user_id_created_at_idx" ON "activity_logs" USING btree ("account_user_id","created_at");--> statement-breakpoint
CREATE INDEX "libraries_organization_id_name_idx" ON "libraries" USING btree ("organization_id","name");--> statement-breakpoint
CREATE INDEX "libraries_storage_id_idx" ON "libraries" USING btree ("storage_id");--> statement-breakpoint
CREATE INDEX "library_api_keys_library_id_created_at_idx" ON "library_api_keys" USING btree ("library_id","created_at");--> statement-breakpoint
CREATE INDEX "webhook_deliveries_webhook_id_created_at_idx" ON "webhook_deliveries" USING btree ("webhook_id","created_at");--> statement-breakpoint
CREATE INDEX "webhook_deliveries_created_at_idx" ON "webhook_deliveries" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "storages_organization_id_idx" ON "storages" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "videos_library_id_created_at_idx" ON "videos" USING btree ("library_id","created_at");--> statement-breakpoint
CREATE INDEX "videos_organization_id_idx" ON "videos" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "videos_processing_status_idx" ON "videos" USING btree ("processing_status");