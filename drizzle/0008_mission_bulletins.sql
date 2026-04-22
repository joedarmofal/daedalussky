CREATE TABLE "mission_bulletins" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL,
  "note" text NOT NULL,
  "created_by_member_id" uuid,
  "created_by_display_name" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE "mission_bulletins" ADD CONSTRAINT "mission_bulletins_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
CREATE INDEX "mission_bulletins_org_created_idx" ON "mission_bulletins" USING btree ("organization_id","created_at");
