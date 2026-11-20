ALTER TABLE "storages" ALTER COLUMN "credentials" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "video_views" ADD CONSTRAINT "video_views_video_library_organization_fk" FOREIGN KEY ("video_id","library_id","organization_id") REFERENCES "public"."videos"("id","library_id","organization_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "storages" DROP COLUMN "credentials_ciphertext";--> statement-breakpoint
ALTER TABLE "storages" DROP COLUMN "credentials_iv";--> statement-breakpoint
ALTER TABLE "storages" DROP COLUMN "credentials_tag";--> statement-breakpoint
ALTER TABLE "storages" DROP COLUMN "credentials_encrypted_key";--> statement-breakpoint
ALTER TABLE "storages" DROP COLUMN "credentials_key_iv";--> statement-breakpoint
ALTER TABLE "storages" DROP COLUMN "credentials_key_tag";