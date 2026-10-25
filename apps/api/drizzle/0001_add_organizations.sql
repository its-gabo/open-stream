CREATE TABLE "organization_deletion_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"scheduled_by_user_id" uuid,
	"scheduled_for" timestamp with time zone NOT NULL,
	"cancel_token_hash" text NOT NULL,
	"delete_token_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organization_deletion_requests_organization_id_unique" UNIQUE("organization_id"),
	CONSTRAINT "organization_deletion_requests_cancel_token_hash_unique" UNIQUE("cancel_token_hash"),
	CONSTRAINT "organization_deletion_requests_delete_token_hash_unique" UNIQUE("delete_token_hash")
);
--> statement-breakpoint
CREATE TABLE "organization_invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"email" text NOT NULL,
	"inviter_id" uuid,
	"status" text DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization_memberships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" text NOT NULL,
	"last_selected_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" varchar(63) NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organizations_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "organization_deletion_requests" ADD CONSTRAINT "organization_deletion_requests_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_deletion_requests" ADD CONSTRAINT "organization_deletion_requests_scheduled_by_user_id_users_id_fk" FOREIGN KEY ("scheduled_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_invitations" ADD CONSTRAINT "organization_invitations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_invitations" ADD CONSTRAINT "organization_invitations_inviter_id_users_id_fk" FOREIGN KEY ("inviter_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_memberships" ADD CONSTRAINT "organization_memberships_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_memberships" ADD CONSTRAINT "organization_memberships_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "organization_deletion_requests_scheduled_for_idx" ON "organization_deletion_requests" USING btree ("scheduled_for");--> statement-breakpoint
CREATE UNIQUE INDEX "organization_invitations_pending_email_unique" ON "organization_invitations" USING btree ("organization_id","email") WHERE "organization_invitations"."status" = 'pending';--> statement-breakpoint
CREATE INDEX "organization_invitations_email_status_idx" ON "organization_invitations" USING btree ("email","status");--> statement-breakpoint
CREATE INDEX "organization_invitations_organization_id_idx" ON "organization_invitations" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "organization_invitations_expires_at_idx" ON "organization_invitations" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "organization_memberships_organization_user_unique" ON "organization_memberships" USING btree ("organization_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "organization_memberships_single_owner_unique" ON "organization_memberships" USING btree ("organization_id") WHERE "organization_memberships"."role" = 'owner';--> statement-breakpoint
CREATE INDEX "organization_memberships_user_id_idx" ON "organization_memberships" USING btree ("user_id");