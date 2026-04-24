import { desc, eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";

import { aircraft } from "@/db/schema/aircraft";
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
      id: aircraft.id,
      baseId: aircraft.baseId,
      tailNumber: aircraft.tailNumber,
      model: aircraft.model,
      notes: aircraft.notes,
      createdAt: aircraft.createdAt,
      updatedAt: aircraft.updatedAt,
    })
    .from(aircraft)
    .where(eq(aircraft.organizationId, requester.organizationId))
    .orderBy(desc(aircraft.createdAt));

  return NextResponse.json({ aircraft: rows });
}

export async function POST(request: Request): Promise<NextResponse> {
  const result = await getRequesterFromRequest(request);
  if ("error" in result) {
    return result.error;
  }
  const { requester, db } = result;

  if (!isOrgAdminRole(requester.role)) {
    return NextResponse.json({ error: "Only administrators can create aircraft." }, { status: 403 });
  }

  const body = (await request.json()) as {
    tailNumber?: string;
    model?: string | null;
    notes?: string | null;
    baseId?: string | null;
  };

  const tailNumber = (body.tailNumber ?? "").trim().toUpperCase();
  if (!tailNumber) {
    return NextResponse.json({ error: "tailNumber is required." }, { status: 400 });
  }

  if (body.baseId) {
    const baseRows = await db
      .select({ id: bases.id })
      .from(bases)
      .where(and(eq(bases.id, body.baseId), eq(bases.organizationId, requester.organizationId)))
      .limit(1);
    if (!baseRows[0]) {
      return NextResponse.json({ error: "Invalid base for this organization." }, { status: 400 });
    }
  }

  try {
    const inserted = await db
      .insert(aircraft)
      .values({
        organizationId: requester.organizationId,
        baseId: body.baseId?.trim() || null,
        tailNumber,
        model: body.model?.trim() || null,
        notes: body.notes?.trim() || null,
      })
      .returning({
        id: aircraft.id,
        baseId: aircraft.baseId,
        tailNumber: aircraft.tailNumber,
        model: aircraft.model,
        notes: aircraft.notes,
        createdAt: aircraft.createdAt,
        updatedAt: aircraft.updatedAt,
      });
    const row = inserted[0];
    if (!row) {
      return NextResponse.json({ error: "Failed to create aircraft." }, { status: 500 });
    }
    return NextResponse.json({ aircraft: row }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "An aircraft with this tail number already exists for your organization." },
      { status: 409 },
    );
  }
}
