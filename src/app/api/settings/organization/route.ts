import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { organizations } from "@/db/schema/organizations";
import { getRequesterFromRequest } from "@/lib/api-auth";
import { isOrgAdminRole } from "@/lib/org-roles";

export async function PATCH(request: Request): Promise<NextResponse> {
  const result = await getRequesterFromRequest(request);
  if ("error" in result) {
    return result.error;
  }
  const { requester, db } = result;

  if (!isOrgAdminRole(requester.role)) {
    return NextResponse.json(
      { error: "Only organization administrators can update organization details." },
      { status: 403 },
    );
  }

  const body = (await request.json()) as {
    displayName?: string;
    legalName?: string;
  };

  const patch: Partial<typeof organizations.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (body.displayName !== undefined) {
    const v = body.displayName.trim();
    if (!v) {
      return NextResponse.json({ error: "displayName cannot be empty." }, { status: 400 });
    }
    patch.displayName = v;
  }
  if (body.legalName !== undefined) {
    const v = body.legalName.trim();
    if (!v) {
      return NextResponse.json({ error: "legalName cannot be empty." }, { status: 400 });
    }
    patch.legalName = v;
  }

  if (Object.keys(patch).length <= 1) {
    return NextResponse.json({ error: "No valid fields to update." }, { status: 400 });
  }

  const updated = await db
    .update(organizations)
    .set(patch)
    .where(eq(organizations.id, requester.organizationId))
    .returning({
      id: organizations.id,
      slug: organizations.slug,
      displayName: organizations.displayName,
      legalName: organizations.legalName,
      status: organizations.status,
      updatedAt: organizations.updatedAt,
    });

  const row = updated[0];
  if (!row) {
    return NextResponse.json({ error: "Organization not found." }, { status: 404 });
  }

  return NextResponse.json({ organization: row });
}
