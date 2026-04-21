import type { FhirId } from "@/types";

/**
 * Row shape for `organizations` — tenant root for Daedalus Sky.
 * All operational data scopes to `id` via foreign keys.
 */
export type OrganizationId = string;

export type OrganizationRow = {
  id: OrganizationId;
  /** URL-safe unique handle (e.g. acme-ops). */
  slug: string;
  /** Legal or registered entity name. */
  legalName: string;
  /** Shown in product UI. */
  displayName: string;
  /** Optional JSON settings (feature flags, locale) — avoid PHI in payloads. */
  settings: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
};

export type NewOrganizationRow = Omit<
  OrganizationRow,
  "id" | "createdAt" | "updatedAt"
> & {
  id?: OrganizationId;
};

/**
 * Optional link to a FHIR Organization resource in Google Healthcare API for clinical sync.
 */
export type OrganizationFhirLink = {
  organizationId: OrganizationId;
  fhirOrganizationId: FhirId;
  fhirStoreName: string;
};
