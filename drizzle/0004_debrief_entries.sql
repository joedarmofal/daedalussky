CREATE TABLE "debrief_entries" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL,
  "module" text NOT NULL,
  "trip_number" text NOT NULL,
  "entry_date" text NOT NULL,
  "crew_member_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "answers" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "status" text DEFAULT 'draft' NOT NULL,
  "created_by_member_id" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE "debrief_entries" ADD CONSTRAINT "debrief_entries_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
CREATE INDEX "debrief_entries_org_module_idx" ON "debrief_entries" USING btree ("organization_id","module");
CREATE INDEX "debrief_entries_org_trip_idx" ON "debrief_entries" USING btree ("organization_id","trip_number");
CREATE INDEX "debrief_entries_org_created_idx" ON "debrief_entries" USING btree ("organization_id","created_at");
