import type { OrganizationId } from "../organization/types";

/**
 * Row shape for `members` — a person within a tenant (Daedalus Sky organization).
 */

export type MemberId = string;

export type MemberRole =
  | "owner"
  | "admin"
  | "dispatcher"
  | "crew"
  | "medic"
  | "viewer";

export type MemberStatus = "invited" | "active" | "suspended";
export type TeamPosition =
  | "Flight RN"
  | "Flight RT"
  | "Flight Paramedic"
  | "Flight Physician"
  | "Pilot"
  | "Mechanic"
  | "Communication Specialist"
  | "Orientee"
  | "Student"
  | "Leader"
  | "Admin"
  | "Safety"
  | "Aviation"
  | "Educator";
export type MobileCarrier =
  | "AT&T"
  | "Verizon"
  | "Sprint"
  | "T-Mobile"
  | "Other";

/** Store mass in SI internally; `weight_display_unit` drives UI formatting. */
export type MassUnit = "kg" | "lb";

export type MemberRow = {
  id: MemberId;
  organizationId: OrganizationId;
  /**
   * Stable subject from IdP (Supabase `auth.users.id`, NextAuth `sub`, or Google `sub`).
   * Nullable while invite is outstanding.
   */
  authSubject: string | null;
  /** IdP hint for migrations and support — e.g. firebase | nextauth | google. */
  authProvider: "firebase" | "supabase" | "nextauth" | "google" | "other" | null;
  email: string | null;
  displayName: string;
  position: TeamPosition | null;
  dateOfBirth: string | null;
  photoDataUrl: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  emergencyContactAddress: string | null;
  employeeId: string | null;
  hireDate: string | null;
  yearsFlightExperience: number | null;
  totalYearsExperience: number | null;
  mobileNumber: string | null;
  mobileCarrier: MobileCarrier | null;
  flightSuitSize: string | null;
  tShirtSize: string | null;
  gender: string | null;
  role: MemberRole;
  status: MemberStatus;
  /** Mass in kilograms for weight-and-balance calculations. */
  weightKg: number | null;
  /** Crew weight in lbs for operational reference. */
  weightLbs: number | null;
  /** When `weight_kg` was last captured or verified. */
  weightRecordedAt: string | null;
  weightDisplayUnit: MassUnit;
  createdAt: string;
  updatedAt: string;
};

export type NewMemberRow = Omit<
  MemberRow,
  "id" | "createdAt" | "updatedAt"
> & {
  id?: MemberId;
};
