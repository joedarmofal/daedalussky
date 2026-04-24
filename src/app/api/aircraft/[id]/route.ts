import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { aircraft } from "@/db/schema/aircraft";
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
    return NextResponse.json({ error: "Only administrators can edit aircraft." }, { status: 403 });
  }

  const { id } = await context.params;
  const body = (await request.json()) as {
    tailNumber?: string;
    model?: string | null;
    notes?: string | null;
    baseId?: string | null;
  };

  const patch: Partial<typeof aircraft.$inferInsert> = { updatedAt: new Date() };
  if (body.baseId !== undefined) {
    const bid = body.baseId?.trim() || null;
    if (bid) {
      const baseRows = await db
        .select({ id: bases.id })
        .from(bases)
        .where(and(eq(bases.id, bid), eq(bases.organizationId, requester.organizationId)))
        .limit(1);
      if (!baseRows[0]) {
        return NextResponse.json({ error: "Invalid base for this organization." }, { status: 400 });
      }
    }
    patch.baseId = bid;
  }
  if (body.tailNumber !== undefined) {
    const v = body.tailNumber.trim().toUpperCase();
    if (!v) {
      return NextResponse.json({ error: "tailNumber cannot be empty." }, { status: 400 });
    }
    patch.tailNumber = v;
  }
  if (body.model !== undefined) {
    patch.model = body.model?.trim() || null;
  }
  if (body.notes !== undefined) {
    patch.notes = body.notes?.trim() || null;
  }

  if (Object.keys(patch).length <= 1) {
    return NextResponse.json({ error: "No valid fields to update." }, { status: 400 });
  }

  try {
    const updated = await db
      .update(aircraft)
      .set(patch)
      .where(and(eq(aircraft.id, id), eq(aircraft.organizationId, requester.organizationId)))
      .returning({
        id: aircraft.id,
        baseId: aircraft.baseId,
        tailNumber: aircraft.tailNumber,
        model: aircraft.model,
        notes: aircraft.notes,
        updatedAt: aircraft.updatedAt,
      });
    const row = updated[0];
    if (!row) {
      return NextResponse.json({ error: "Aircraft not found." }, { status: 404 });
    }
    return NextResponse.json({ aircraft: row });
  } catch {
    return NextResponse.json(
      { error: "An aircraft with this tail number already exists for your organization." },
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
    return NextResponse.json({ error: "Only administrators can delete aircraft." }, { status: 403 });
  }

  const { id } = await context.params;

  const deleted = await db
    .delete(aircraft)
    .where(and(eq(aircraft.id, id), eq(aircraft.organizationId, requester.organizationId)))
    .returning({ id: aircraft.id });

  if (!deleted[0]) {
    return NextResponse.json({ error: "Aircraft not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
