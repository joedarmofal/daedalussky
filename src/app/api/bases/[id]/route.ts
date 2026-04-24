import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { bases } from "@/db/schema/bases";
import { getRequesterFromRequest } from "@/lib/api-auth";
import { isOrgAdminRole } from "@/lib/org-roles";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Params): Promise<NextResponse> {
  const result = await getRequesterFromRequest(request);
  if ("error" in result) {
    return result.error;
  }
  const { requester, db } = result;
  if (!isOrgAdminRole(requester.role)) {
    return NextResponse.json({ error: "Only administrators can edit bases." }, { status: 403 });
  }

  const { id } = await context.params;
  const body = (await request.json()) as {
    name?: string;
    code?: string | null;
    notes?: string | null;
  };

  const patch: Partial<typeof bases.$inferInsert> = { updatedAt: new Date() };
  if (body.name !== undefined) {
    const v = body.name.trim();
    if (!v) {
      return NextResponse.json({ error: "name cannot be empty." }, { status: 400 });
    }
    patch.name = v;
  }
  if (body.code !== undefined) {
    patch.code = body.code?.trim() || null;
  }
  if (body.notes !== undefined) {
    patch.notes = body.notes?.trim() || null;
  }

  if (Object.keys(patch).length <= 1) {
    return NextResponse.json({ error: "No valid fields to update." }, { status: 400 });
  }

  try {
    const updated = await db
      .update(bases)
      .set(patch)
      .where(and(eq(bases.id, id), eq(bases.organizationId, requester.organizationId)))
      .returning({
        id: bases.id,
        name: bases.name,
        code: bases.code,
        notes: bases.notes,
        updatedAt: bases.updatedAt,
      });
    const row = updated[0];
    if (!row) {
      return NextResponse.json({ error: "Base not found." }, { status: 404 });
    }
    return NextResponse.json({ base: row });
  } catch {
    return NextResponse.json(
      { error: "A base with this name already exists for your organization." },
      { status: 409 },
    );
  }
}

export async function DELETE(_request: Request, context: Params): Promise<NextResponse> {
  const result = await getRequesterFromRequest(_request);
  if ("error" in result) {
    return result.error;
  }
  const { requester, db } = result;
  if (!isOrgAdminRole(requester.role)) {
    return NextResponse.json({ error: "Only administrators can delete bases." }, { status: 403 });
  }

  const { id } = await context.params;

  const deleted = await db
    .delete(bases)
    .where(and(eq(bases.id, id), eq(bases.organizationId, requester.organizationId)))
    .returning({ id: bases.id });

  if (!deleted[0]) {
    return NextResponse.json({ error: "Base not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
