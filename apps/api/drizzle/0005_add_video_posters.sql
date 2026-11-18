ALTER TABLE "videos" ADD COLUMN "poster_source" text DEFAULT 'automatic' NOT NULL;--> statement-breakpoint
ALTER TABLE "videos" ADD COLUMN "poster_frame_seconds" double precision;--> statement-breakpoint
ALTER TABLE "videos" ADD COLUMN "poster_updated_at" timestamp with time zone;--> statement-breakpoint
UPDATE "videos" SET "poster_updated_at" = "processed_at";