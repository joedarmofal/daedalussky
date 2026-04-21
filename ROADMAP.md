# Daedalus Sky — Product Roadmap

Multi-tenant flight operations platform with clinical-grade interoperability. This document tracks major workstreams; implementation details live next to code (`src/models`, `src/types/fhir`, `src/integrations/google-cloud-healthcare`).

## Phase 1 — Tenant core and identity

- **Multi-tenant auth (Supabase)**  
  - **Chosen:** Supabase Auth with `@supabase/ssr` for Next.js App Router (`src/utils/supabase/*`, `src/middleware.ts`).  
  - Persist `members.auth_subject` = `auth.users.id` (as text) and `auth_provider` = `supabase` on provisioning / first login.  
  - **Drizzle** schema lives in `src/db/schema/`; migrations in `drizzle/` (`npm run db:generate`, `npm run db:migrate`).  
  - **RLS:** `drizzle/0001_rls_org_scope.sql` scopes reads/updates by `organization_id` and `auth.uid()` for the `authenticated` role (stubs — extend with INSERT policies and column guards as flows land).

- **Organization and member data**  
  - Land SQL in `src/models/organization/organization.schema.sql` and `src/models/member/*.schema.sql` behind migrations (Drizzle/Prisma/pg raw).  
  - Application services enforce `organization_id` on every query.

## Phase 2 — Operations profile (Member schema)

- **Weight and balance inputs**  
  - Persist `weight_kg` + `weight_recorded_at` + `weight_display_unit` (see `src/models/member/types.ts`).  
  - Optional follow-up: `member_weight_events` history table for audit-heavy operators.

- **Certification tracking**  
  - `member_certifications` with status and expiry-driven alerts (see `src/models/member/member-certification.schema.sql`).  
  - Background jobs for renewal reminders; no PHI in notification payloads unless policy allows.

## Phase 3 — Experience system (“Technical Renaissance”)

- **Style guide**  
  - See `docs/style-guide.md` — dark-first, blueprint grid, restrained accent, monospace data.  
  - Implement design tokens in `src/app/globals.css` and Tailwind `@theme`.

- **Shell UX**  
  - Tenant switcher (for users in multiple orgs), role-based navigation, and debrief-oriented layouts.

## Phase 4 — HL7 / FHIR integration (clinical guidelines and debriefs)

- **Guidelines**  
  - Represent machine-readable rules as **FHIR PlanDefinition** / **ActivityDefinition** where appropriate; supplement with **Library** (CQL) or external artifact URLs per your clinical governance.  
  - Sync read-only artifacts to Google Healthcare API FHIR store; version and profile URIs in `meta.profile`.

- **Debriefs**  
  - Model structured debrief narratives as **Composition** (sections) + **DiagnosticReport** or **Encounter** references for the underlying mission; attach **DocumentReference** for PDF/markdown when required.  
  - HL7 v2 remains available for legacy feeds (`src/models/hl7`); normalize to FHIR at the boundary before persistence in GCP.

- **Platform plumbing**  
  - Server-only clients, workload identity, least-privilege IAM, and **no PHI in application logs** (see `.cursorrules`).

## Phase 5 — Scale and compliance hardening

- Per-tenant rate limits, data residency options, backup/restore drills, and formal security review for regulated payloads.
