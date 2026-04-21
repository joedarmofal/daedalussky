-- Row Level Security stubs — Supabase (auth.uid()) + organization_id tenancy.
-- Table owner / service_role bypasses RLS. Use a non-owner DB role in Drizzle only if you intend DB-enforced RLS in the app tier.
--> statement-breakpoint
ALTER TABLE "organizations" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "members" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "member_certifications" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
GRANT SELECT ON "organizations" TO authenticated;
--> statement-breakpoint
GRANT SELECT ON "members" TO authenticated;
--> statement-breakpoint
GRANT SELECT ON "member_certifications" TO authenticated;
--> statement-breakpoint
CREATE POLICY "organizations_select_if_active_member"
ON "organizations"
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM "members" m
    WHERE m.organization_id = "organizations".id
      AND m.auth_subject = auth.uid()::text
      AND m.status = 'active'
  )
);
--> statement-breakpoint
CREATE POLICY "organizations_update_if_admin"
ON "organizations"
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM "members" m
    WHERE m.organization_id = "organizations".id
      AND m.auth_subject = auth.uid()::text
      AND m.status = 'active'
      AND m.role IN ('owner', 'admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM "members" m
    WHERE m.organization_id = "organizations".id
      AND m.auth_subject = auth.uid()::text
      AND m.status = 'active'
      AND m.role IN ('owner', 'admin')
  )
);
--> statement-breakpoint
CREATE POLICY "members_select_same_org"
ON "members"
FOR SELECT
TO authenticated
USING (
  "organization_id" IN (
    SELECT m.organization_id
    FROM "members" m
    WHERE m.auth_subject = auth.uid()::text
      AND m.status = 'active'
  )
);
--> statement-breakpoint
CREATE POLICY "members_update_if_self_or_org_admin"
ON "members"
FOR UPDATE
TO authenticated
USING (
  auth_subject = auth.uid()::text
  OR EXISTS (
    SELECT 1
    FROM "members" admin
    WHERE admin.organization_id = "members".organization_id
      AND admin.auth_subject = auth.uid()::text
      AND admin.status = 'active'
      AND admin.role IN ('owner', 'admin')
  )
)
WITH CHECK (
  auth_subject = auth.uid()::text
  OR EXISTS (
    SELECT 1
    FROM "members" admin
    WHERE admin.organization_id = "members".organization_id
      AND admin.auth_subject = auth.uid()::text
      AND admin.status = 'active'
      AND admin.role IN ('owner', 'admin')
  )
);
--> statement-breakpoint
CREATE POLICY "member_certifications_select_same_org"
ON "member_certifications"
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM "members" subject
    INNER JOIN "members" viewer ON viewer.organization_id = subject.organization_id
    WHERE subject.id = "member_certifications".member_id
      AND viewer.auth_subject = auth.uid()::text
      AND viewer.status = 'active'
  )
);
