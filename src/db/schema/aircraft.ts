import { index, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";

import { bases } from "./bases";
import { organizations } from "./organizations";

export const aircraft = pgTable(
  "aircraft",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    baseId: uuid("base_id").references(() => bases.id, { onDelete: "set null" }),
    tailNumber: text("tail_number").notNull(),
    model: text("model"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("aircraft_organization_id_idx").on(table.organizationId),
    index("aircraft_base_id_idx").on(table.baseId),
    unique("aircraft_org_tail_unique").on(table.organizationId, table.tailNumber),
  ],
);
