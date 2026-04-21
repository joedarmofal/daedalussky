import { sql } from "drizzle-orm";
import {
  check,
  date,
  index,
  numeric,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

import {
  massUnitEnum,
  memberRoleEnum,
  memberStatusEnum,
} from "./enums";
import { organizations } from "./organizations";

export const members = pgTable(
  "members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    authSubject: text("auth_subject"),
    authProvider: text("auth_provider"),
    email: text("email"),
    displayName: text("display_name").notNull(),
    position: text("position"),
    dateOfBirth: date("date_of_birth"),
    photoDataUrl: text("photo_data_url"),
    emergencyContactName: text("emergency_contact_name"),
    emergencyContactPhone: text("emergency_contact_phone"),
    emergencyContactAddress: text("emergency_contact_address"),
    employeeId: text("employee_id"),
    hireDate: date("hire_date"),
    yearsFlightExperience: numeric("years_flight_experience", {
      precision: 5,
      scale: 2,
    }),
    totalYearsExperience: numeric("total_years_experience", {
      precision: 5,
      scale: 2,
    }),
    mobileNumber: text("mobile_number"),
    mobileCarrier: text("mobile_carrier"),
    flightSuitSize: text("flight_suit_size"),
    tShirtSize: text("t_shirt_size"),
    gender: text("gender"),
    role: memberRoleEnum("role").notNull().default("viewer"),
    status: memberStatusEnum("status").notNull().default("invited"),
    weightKg: numeric("weight_kg", { precision: 7, scale: 3 }),
    weightLbs: numeric("weight_lbs", { precision: 7, scale: 2 }),
    weightRecordedAt: timestamp("weight_recorded_at", { withTimezone: true }),
    weightDisplayUnit: massUnitEnum("weight_display_unit")
      .notNull()
      .default("kg"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("members_auth_unique").on(table.organizationId, table.authSubject),
    unique("members_email_unique").on(table.organizationId, table.email),
    index("members_org_role_idx").on(table.organizationId, table.role),
    index("members_org_status_idx").on(table.organizationId, table.status),
    check(
      "members_weight_kg_positive",
      sql`${table.weightKg} IS NULL OR ${table.weightKg} > 0`,
    ),
    check(
      "members_weight_lbs_positive",
      sql`${table.weightLbs} IS NULL OR ${table.weightLbs} > 0`,
    ),
  ],
);
