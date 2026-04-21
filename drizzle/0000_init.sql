CREATE TYPE "public"."certification_status" AS ENUM('active', 'expired', 'revoked', 'pending_verification');--> statement-breakpoint
CREATE TYPE "public"."mass_unit" AS ENUM('kg', 'lb');--> statement-breakpoint
CREATE TYPE "public"."member_role" AS ENUM('owner', 'admin', 'dispatcher', 'crew', 'medic', 'viewer');--> statement-breakpoint
CREATE TYPE "public"."member_status" AS ENUM('invited', 'active', 'suspended');--> statement-breakpoint
CREATE TYPE "public"."organization_status" AS ENUM('active', 'suspended', 'archived');--> statement-breakpoint
CREATE TABLE "member_certifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" uuid NOT NULL,
	"certification_code" text NOT NULL,
	"title" text NOT NULL,
	"issuing_body" text,
	"credential_identifier" text,
	"effective_date" date,
	"expiration_date" date,
	"status" "certification_status" DEFAULT 'pending_verification' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"auth_subject" text,
	"auth_provider" text,
	"email" text,
	"display_name" text NOT NULL,
	"role" "member_role" DEFAULT 'viewer' NOT NULL,
	"status" "member_status" DEFAULT 'invited' NOT NULL,
	"weight_kg" numeric(7, 3),
	"weight_recorded_at" timestamp with time zone,
	"weight_display_unit" "mass_unit" DEFAULT 'kg' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "members_auth_unique" UNIQUE("organization_id","auth_subject"),
	CONSTRAINT "members_email_unique" UNIQUE("organization_id","email"),
	CONSTRAINT "members_weight_kg_positive" CHECK ("members"."weight_kg" IS NULL OR "members"."weight_kg" > 0)
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"legal_name" text NOT NULL,
	"display_name" text NOT NULL,
	"status" "organization_status" DEFAULT 'active' NOT NULL,
	"settings" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organizations_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "member_certifications" ADD CONSTRAINT "member_certifications_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "members" ADD CONSTRAINT "members_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "member_certifications_member_idx" ON "member_certifications" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "member_certifications_status_idx" ON "member_certifications" USING btree ("status");--> statement-breakpoint
CREATE INDEX "member_certifications_expiration_idx" ON "member_certifications" USING btree ("expiration_date");--> statement-breakpoint
CREATE INDEX "members_org_role_idx" ON "members" USING btree ("organization_id","role");--> statement-breakpoint
CREATE INDEX "members_org_status_idx" ON "members" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "organizations_status_idx" ON "organizations" USING btree ("status");