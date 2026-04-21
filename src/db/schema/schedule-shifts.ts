import { sql } from "drizzle-orm";
import { index, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { organizations } from "./organizations";

export const scheduleShifts = pgTable(
  "schedule_shifts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    shiftDate: text("shift_date").notNull(),
    missionLabel: text("mission_label").notNull(),
    baseName: text("base_name").notNull(),
    shiftStart: text("shift_start"),
    shiftEnd: text("shift_end"),
    crewAssignments: jsonb("crew_assignments")
      .$type<{ role: string; memberId: string }[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    notes: text("notes"),
    createdByMemberId: uuid("created_by_member_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("schedule_shifts_org_date_idx").on(table.organizationId, table.shiftDate),
    index("schedule_shifts_org_created_idx").on(table.organizationId, table.createdAt),
  ],
);
