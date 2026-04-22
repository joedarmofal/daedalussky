import { boolean, index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { organizations } from "./organizations";

export const missionBulletins = pgTable(
  "mission_bulletins",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    note: text("note").notNull(),
    isImportant: boolean("is_important").notNull().default(false),
    createdByMemberId: uuid("created_by_member_id"),
    createdByDisplayName: text("created_by_display_name"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("mission_bulletins_org_created_idx").on(table.organizationId, table.createdAt),
  ],
);
