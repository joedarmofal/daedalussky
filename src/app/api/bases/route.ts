import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { bases } from "@/db/schema/bases";
import { getRequesterFromRequest } from "@/lib/api-auth";
import { isOrgAdminRole } from "@/lib/org-roles";

export async function GET(request: Request): Promise<NextResponse> {
  const result = await getRequesterFromRequest(request);
  if ("error" in result) {
    return result.error;
  }
  const { requester, db } = result;

  const rows = await db
    .select({
      id: bases.id,
      name: bases.name,
      code: bases.code,
      notes: bases.notes,
      createdAt: bases.createdAt,
      updatedAt: bases.updatedAt,
    })
    .from(bases)
    .where(eq(bases.organizationId, requester.organizationId))
    .orderBy(desc(bases.createdAt));

  return NextResponse.json({ bases: rows });
}

export async function POST(request: Request): Promise<NextResponse> {
  const result = await getRequesterFromRequest(request);
  if ("error" in result) {
    return result.error;
  }
  const { requester, db } = result;

  if (!isOrgAdminRole(requester.role)) {
    return NextResponse.json({ error: "Only administrators can create bases." }, { status: 403 });
  }

  const body = (await request.json()) as { name?: string; code?: string | null; notes?: string | null };
  const name = (body.name ?? "").trim();
  if (!name) {
    return NextResponse.json({ error: "name is required." }, { status: 400 });
  }

  try {
    const inserted = await db
      .insert(bases)
      .values({
        organizationId: requester.organizationId,
        name,
        code: body.code?.trim() || null,
        notes: body.notes?.trim() || null,
      })
      .returning({
        id: bases.id,
        name: bases.name,
        code: bases.code,
        notes: bases.notes,
        createdAt: bases.createdAt,
        updatedAt: bases.updatedAt,
      });
    const row = inserted[0];
    if (!row) {
      return NextResponse.json({ error: "Failed to create base." }, { status: 500 });
    }
    return NextResponse.json({ base: row }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "A base with this name already exists for your organization." },
      { status: 409 },
    );
  }
}
