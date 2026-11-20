CREATE TABLE "playlist_items" (
	"playlist_id" uuid NOT NULL,
	"video_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"library_id" uuid NOT NULL,
	"position" integer NOT NULL,
	CONSTRAINT "playlist_items_pk" PRIMARY KEY("playlist_id","video_id"),
	CONSTRAINT "playlist_items_playlist_id_position_unique" UNIQUE("playlist_id","position"),
	CONSTRAINT "playlist_items_position_check" CHECK ("playlist_items"."position" >= 0 and "playlist_items"."position" < 50)
);
--> statement-breakpoint
CREATE TABLE "playlists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"library_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"created_by_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "playlists_id_library_organization_unique" UNIQUE("id","library_id","organization_id"),
	CONSTRAINT "playlists_title_check" CHECK (btrim("playlists"."title") <> ''),
	CONSTRAINT "playlists_description_check" CHECK ("playlists"."description" <> '')
);
--> statement-breakpoint
ALTER TABLE "activity_logs" DROP CONSTRAINT "activity_logs_action_check";--> statement-breakpoint
ALTER TABLE "activity_logs" DROP CONSTRAINT "activity_logs_resource_type_check";--> statement-breakpoint
ALTER TABLE "libraries" ALTER COLUMN "player_settings" SET DEFAULT '{"accentColor":"#ffffff","showTitle":true,"showSettingsMenu":true,"showPictureInPicture":true,"showFullscreen":true,"showChapters":true,"autoplayNext":true}'::jsonb;--> statement-breakpoint
ALTER TABLE "videos" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "playlist_items" ADD CONSTRAINT "playlist_items_playlist_fk" FOREIGN KEY ("playlist_id","library_id","organization_id") REFERENCES "public"."playlists"("id","library_id","organization_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "playlist_items" ADD CONSTRAINT "playlist_items_video_fk" FOREIGN KEY ("video_id","library_id","organization_id") REFERENCES "public"."videos"("id","library_id","organization_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "playlists" ADD CONSTRAINT "playlists_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "playlists" ADD CONSTRAINT "playlists_library_organization_fk" FOREIGN KEY ("library_id","organization_id") REFERENCES "public"."libraries"("id","organization_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "playlist_items_video_id_idx" ON "playlist_items" USING btree ("video_id");--> statement-breakpoint
CREATE INDEX "playlists_library_id_created_at_idx" ON "playlists" USING btree ("library_id","created_at");--> statement-breakpoint
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_action_check" CHECK ("activity_logs"."action" in ('account.signed_up', 'account.email_verified', 'account.signed_in', 'account.sign_in_failed', 'account.signed_out', 'account.password_reset_requested', 'account.password_reset', 'organization.created', 'organization.updated', 'organization.deletion_scheduled', 'organization.deletion_canceled', 'organization.deleted', 'organization.ownership_transferred', 'invitation.created', 'invitation.resent', 'invitation.canceled', 'invitation.accepted', 'invitation.declined', 'membership.removed', 'membership.left', 'storage.created', 'storage.updated', 'storage.deleted', 'library.created', 'library.updated', 'library.storage_changed', 'library.encoding_updated', 'library.security_updated', 'library.player_updated', 'api_key.created', 'api_key.updated', 'api_key.rolled', 'api_key.deleted', 'webhook.created', 'webhook.updated', 'webhook.deleted', 'webhook.secret_rolled', 'webhook.test_sent', 'webhook.delivery_resent', 'video.created', 'video.updated', 'video.poster_updated', 'video.chapters_updated', 'video.deleted', 'video.uploaded', 'video.upload_canceled', 'video.import_started', 'video.reprocess_requested', 'playlist.created', 'playlist.updated', 'playlist.videos_updated', 'playlist.deleted'));--> statement-breakpoint
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_resource_type_check" CHECK ("activity_logs"."resource_type" in ('account', 'organization', 'invitation', 'membership', 'storage', 'library', 'api_key', 'webhook', 'video', 'playlist'));--> statement-breakpoint
ALTER TABLE "videos" ADD CONSTRAINT "videos_description_check" CHECK ("videos"."description" <> '');