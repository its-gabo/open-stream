CREATE TABLE "video_views" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"library_id" uuid NOT NULL,
	"video_id" uuid NOT NULL,
	"device_type" text NOT NULL,
	"embedding_host" text,
	"watched_seconds" double precision DEFAULT 0 NOT NULL,
	"furthest_position_seconds" double precision DEFAULT 0 NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_reported_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "video_views" ADD CONSTRAINT "video_views_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_views" ADD CONSTRAINT "video_views_video_id_videos_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."videos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "video_views_organization_id_started_at_idx" ON "video_views" USING btree ("organization_id","started_at");--> statement-breakpoint
CREATE INDEX "video_views_library_id_started_at_idx" ON "video_views" USING btree ("library_id","started_at");--> statement-breakpoint
CREATE INDEX "video_views_video_id_started_at_idx" ON "video_views" USING btree ("video_id","started_at");