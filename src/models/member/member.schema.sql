-- Daedalus Sky — members (per-tenant users with operational attributes)

CREATE TYPE member_role AS ENUM (
  'owner',
  'admin',
  'dispatcher',
  'crew',
  'medic',
  'viewer'
);

CREATE TYPE member_status AS ENUM ('invited', 'active', 'suspended');

CREATE TYPE mass_unit AS ENUM ('kg', 'lb');

CREATE TABLE members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
  auth_subject TEXT,
  auth_provider TEXT,
  email TEXT,
  display_name TEXT NOT NULL,
  role member_role NOT NULL DEFAULT 'viewer',
  status member_status NOT NULL DEFAULT 'invited',
  weight_kg NUMERIC(7, 3),
  weight_recorded_at TIMESTAMPTZ,
  weight_display_unit mass_unit NOT NULL DEFAULT 'kg',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT members_auth_unique UNIQUE (organization_id, auth_subject),
  CONSTRAINT members_email_unique UNIQUE (organization_id, email),
  CONSTRAINT members_weight_kg_positive CHECK (weight_kg IS NULL OR weight_kg > 0)
);

CREATE INDEX members_org_role_idx ON members (organization_id, role);
CREATE INDEX members_org_status_idx ON members (organization_id, status);

COMMENT ON TABLE members IS 'Operational identity within a tenant; tie auth via auth_subject + auth_provider.';
COMMENT ON COLUMN members.weight_kg IS 'Latest known mass in kg for W&B; history can be added later via member_weight_events if needed.';
COMMENT ON COLUMN members.email IS 'Unique per organization; may duplicate across tenants.';
