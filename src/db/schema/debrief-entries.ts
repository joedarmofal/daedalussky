import { sql } from "drizzle-orm";
import { index, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { organizations } from "./organizations";

export const debriefEntries = pgTable(
  "debrief_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    module: text("module").notNull(),
    tripNumber: text("trip_number").notNull(),
    entryDate: text("entry_date").notNull(),
    crewMemberIds: jsonb("crew_member_ids")
      .$type<string[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    answers: jsonb("answers")
      .$type<Record<string, string>>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    concernEscalated: text("concern_escalated").notNull().default("false"),
    concernSummary: text("concern_summary"),
    taggedMemberId: uuid("tagged_member_id"),
    taggedMemberEmail: text("tagged_member_email"),
    notificationStatus: text("notification_status").notNull().default("not_requested"),
    status: text("status").notNull().default("draft"),
    createdByMemberId: uuid("created_by_member_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("debrief_entries_org_module_idx").on(table.organizationId, table.module),
    index("debrief_entries_org_trip_idx").on(table.organizationId, table.tripNumber),
    index("debrief_entries_org_created_idx").on(table.organizationId, table.createdAt),
  ],
);
