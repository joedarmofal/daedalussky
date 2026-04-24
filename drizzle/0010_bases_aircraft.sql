CREATE TABLE IF NOT EXISTS "bases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"code" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bases" ADD CONSTRAINT "bases_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "bases_org_name_unique" ON "bases" USING btree ("organization_id","name");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bases_organization_id_idx" ON "bases" USING btree ("organization_id");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "aircraft" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"base_id" uuid,
	"tail_number" text NOT NULL,
	"model" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "aircraft" ADD CONSTRAINT "aircraft_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "aircraft" ADD CONSTRAINT "aircraft_base_id_bases_id_fk" FOREIGN KEY ("base_id") REFERENCES "public"."bases"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "aircraft_org_tail_unique" ON "aircraft" USING btree ("organization_id","tail_number");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "aircraft_organization_id_idx" ON "aircraft" USING btree ("organization_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "aircraft_base_id_idx" ON "aircraft" USING btree ("base_id");
