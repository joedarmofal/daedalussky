import { sql } from "drizzle-orm";
import {
  date,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { certificationStatusEnum } from "./enums";
import { members } from "./members";

export const memberCertifications = pgTable(
  "member_certifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    memberId: uuid("member_id")
      .notNull()
      .references(() => members.id, { onDelete: "cascade" }),
    certificationCode: text("certification_code").notNull(),
    title: text("title").notNull(),
    issuingBody: text("issuing_body"),
    credentialIdentifier: text("credential_identifier"),
    effectiveDate: date("effective_date"),
    expirationDate: date("expiration_date"),
    certificationImageDataUrl: text("certification_image_data_url"),
    status: certificationStatusEnum("status")
      .notNull()
      .default("pending_verification"),
    metadata: jsonb("metadata")
      .notNull()
      .default(sql`'{}'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("member_certifications_member_idx").on(table.memberId),
    index("member_certifications_status_idx").on(table.status),
    index("member_certifications_expiration_idx").on(table.expirationDate),
  ],
);
