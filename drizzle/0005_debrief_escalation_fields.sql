ALTER TABLE "debrief_entries" ADD COLUMN "concern_escalated" text DEFAULT 'false' NOT NULL;
ALTER TABLE "debrief_entries" ADD COLUMN "concern_summary" text;
ALTER TABLE "debrief_entries" ADD COLUMN "tagged_member_id" uuid;
ALTER TABLE "debrief_entries" ADD COLUMN "tagged_member_email" text;
ALTER TABLE "debrief_entries" ADD COLUMN "notification_status" text DEFAULT 'not_requested' NOT NULL;
