CREATE TABLE "mission_hazards" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL,
  "title" text NOT NULL,
  "details" text,
  "status" text DEFAULT 'current' NOT NULL,
  "created_by_member_id" uuid,
  "resolved_by_member_id" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "resolved_at" timestamp with time zone,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE "mission_hazards" ADD CONSTRAINT "mission_hazards_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
CREATE INDEX "mission_hazards_org_status_idx" ON "mission_hazards" USING btree ("organization_id","status");
CREATE INDEX "mission_hazards_org_created_idx" ON "mission_hazards" USING btree ("organization_id","created_at");
