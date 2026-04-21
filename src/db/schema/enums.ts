import { pgEnum } from "drizzle-orm/pg-core";

export const organizationStatusEnum = pgEnum("organization_status", [
  "active",
  "suspended",
  "archived",
]);

export const memberRoleEnum = pgEnum("member_role", [
  "owner",
  "admin",
  "dispatcher",
  "crew",
  "medic",
  "viewer",
]);

export const memberStatusEnum = pgEnum("member_status", [
  "invited",
  "active",
  "suspended",
]);

export const massUnitEnum = pgEnum("mass_unit", ["kg", "lb"]);

export const certificationStatusEnum = pgEnum("certification_status", [
  "active",
  "expired",
  "revoked",
  "pending_verification",
]);
