CREATE TABLE "pulse_check_links" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL,
  "trip_number" text NOT NULL,
  "token" text NOT NULL,
  "status" text DEFAULT 'active' NOT NULL,
  "created_by_member_id" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "pulse_check_links_token_unique" UNIQUE("token")
);
ALTER TABLE "pulse_check_links" ADD CONSTRAINT "pulse_check_links_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
CREATE INDEX "pulse_check_links_org_trip_idx" ON "pulse_check_links" USING btree ("organization_id","trip_number");
CREATE INDEX "pulse_check_links_org_created_idx" ON "pulse_check_links" USING btree ("organization_id","created_at");

CREATE TABLE "pulse_check_responses" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "link_id" uuid NOT NULL,
  "overall_rating" integer NOT NULL,
  "communication_rating" integer,
  "professionalism_rating" integer,
  "would_recommend" text NOT NULL,
  "comments" text,
  "respondent_email" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE "pulse_check_responses" ADD CONSTRAINT "pulse_check_responses_link_id_pulse_check_links_id_fk" FOREIGN KEY ("link_id") REFERENCES "public"."pulse_check_links"("id") ON DELETE cascade ON UPDATE no action;
CREATE INDEX "pulse_check_responses_link_idx" ON "pulse_check_responses" USING btree ("link_id");
CREATE INDEX "pulse_check_responses_created_idx" ON "pulse_check_responses" USING btree ("created_at");
