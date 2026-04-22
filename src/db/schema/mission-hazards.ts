import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { organizations } from "./organizations";

export const missionHazards = pgTable(
  "mission_hazards",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    details: text("details"),
    status: text("status").notNull().default("current"),
    createdByMemberId: uuid("created_by_member_id"),
    resolvedByMemberId: uuid("resolved_by_member_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("mission_hazards_org_status_idx").on(table.organizationId, table.status),
    index("mission_hazards_org_created_idx").on(table.organizationId, table.createdAt),
  ],
);
