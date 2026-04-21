CREATE TABLE "schedule_shifts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL,
  "shift_date" text NOT NULL,
  "mission_label" text NOT NULL,
  "base_name" text NOT NULL,
  "shift_start" text,
  "shift_end" text,
  "crew_assignments" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "notes" text,
  "created_by_member_id" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE "schedule_shifts" ADD CONSTRAINT "schedule_shifts_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
CREATE INDEX "schedule_shifts_org_date_idx" ON "schedule_shifts" USING btree ("organization_id","shift_date");
CREATE INDEX "schedule_shifts_org_created_idx" ON "schedule_shifts" USING btree ("organization_id","created_at");
