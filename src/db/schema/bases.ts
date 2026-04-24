import { index, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";

import { organizations } from "./organizations";

export const bases = pgTable(
  "bases",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    code: text("code"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("bases_organization_id_idx").on(table.organizationId),
    unique("bases_org_name_unique").on(table.organizationId, table.name),
  ],
);
