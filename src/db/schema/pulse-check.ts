import { index, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { organizations } from "./organizations";

export const pulseCheckLinks = pgTable(
  "pulse_check_links",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    tripNumber: text("trip_number").notNull(),
    token: text("token").notNull().unique(),
    status: text("status").notNull().default("active"),
    createdByMemberId: uuid("created_by_member_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("pulse_check_links_org_trip_idx").on(table.organizationId, table.tripNumber),
    index("pulse_check_links_org_created_idx").on(table.organizationId, table.createdAt),
  ],
);

export const pulseCheckResponses = pgTable(
  "pulse_check_responses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    linkId: uuid("link_id")
      .notNull()
      .references(() => pulseCheckLinks.id, { onDelete: "cascade" }),
    overallRating: integer("overall_rating").notNull(),
    communicationRating: integer("communication_rating"),
    professionalismRating: integer("professionalism_rating"),
    wouldRecommend: text("would_recommend").notNull(),
    comments: text("comments"),
    respondentEmail: text("respondent_email"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("pulse_check_responses_link_idx").on(table.linkId),
    index("pulse_check_responses_created_idx").on(table.createdAt),
  ],
);
