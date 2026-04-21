-- Daedalus Sky — organizations (multi-tenant root)
-- Target: PostgreSQL 15+ (Supabase-compatible)

CREATE TYPE organization_status AS ENUM ('active', 'suspended', 'archived');

CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  legal_name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  status organization_status NOT NULL DEFAULT 'active',
  settings JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX organizations_status_idx ON organizations (status);

COMMENT ON TABLE organizations IS 'Tenant boundary for flight operations; every member belongs to exactly one organization.';
COMMENT ON COLUMN organizations.slug IS 'Immutable URL identifier; enforce lowercase at application layer.';
COMMENT ON COLUMN organizations.settings IS 'Non-clinical configuration only unless covered by BAAs and data classification policy.';
