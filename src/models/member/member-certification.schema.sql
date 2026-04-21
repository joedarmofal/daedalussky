-- Daedalus Sky — member_certifications (credential lifecycle per member)

CREATE TYPE certification_status AS ENUM (
  'active',
  'expired',
  'revoked',
  'pending_verification'
);

CREATE TABLE member_certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members (id) ON DELETE CASCADE,
  certification_code TEXT NOT NULL,
  title TEXT NOT NULL,
  issuing_body TEXT,
  credential_identifier TEXT,
  effective_date DATE,
  expiration_date DATE,
  status certification_status NOT NULL DEFAULT 'pending_verification',
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX member_certifications_member_idx ON member_certifications (member_id);
CREATE INDEX member_certifications_status_idx ON member_certifications (status);
CREATE INDEX member_certifications_expiration_idx ON member_certifications (expiration_date);

COMMENT ON TABLE member_certifications IS 'Tracks certifications, medicals, and ratings with explicit expiry for alerting.';
COMMENT ON COLUMN member_certifications.metadata IS 'Structured attachments (document refs); do not store unencrypted PHI without policy controls.';
