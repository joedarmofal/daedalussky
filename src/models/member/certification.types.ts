/**
 * Certification / credential rows for crew and ops personnel.
 * Separate table supports history, renewals, and auditing without denormalizing member rows.
 */

import type { MemberId } from "./types";

export type MemberCertificationId = string;

export type CertificationStatus =
  | "active"
  | "expired"
  | "revoked"
  | "pending_verification";

export type MemberCertificationRow = {
  id: MemberCertificationId;
  memberId: MemberId;
  /** Stable internal code (e.g. FAA_COMMERCIAL, EASA_MED_CLASS2). */
  certificationCode: string;
  /** Human-readable title for UI and exports. */
  title: string;
  issuingBody: string | null;
  /** License or certificate number when applicable. */
  credentialIdentifier: string | null;
  effectiveDate: string | null;
  expirationDate: string | null;
  certificationImageDataUrl: string | null;
  status: CertificationStatus;
  /** Issuer metadata, scan URLs, etc. — classify storage under security policy. */
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
};

export type NewMemberCertificationRow = Omit<
  MemberCertificationRow,
  "id" | "createdAt" | "updatedAt"
> & {
  id?: MemberCertificationId;
};
