import { and, desc, eq, gte } from "drizzle-orm";
import { NextResponse } from "next/server";

import { missionBulletins } from "@/db/schema/mission-bulletins";
import { getRequesterFromRequest } from "@/lib/api-auth";

export async function GET(request: Request): Promise<NextResponse> {
  const result = await getRequesterFromRequest(request);
  if ("error" in result) {
    return result.error;
  }
  const { requester, db } = result;
  const { searchParams } = new URL(request.url);
  const range = searchParams.get("range") === "24h" ? "24h" : "all";
  const cutoff =
    range === "24h" ? new Date(Date.now() - 24 * 60 * 60 * 1000) : null;

  const query = db
    .select({
      id: missionBulletins.id,
      note: missionBulletins.note,
      isImportant: missionBulletins.isImportant,
      createdByDisplayName: missionBulletins.createdByDisplayName,
      createdAt: missionBulletins.createdAt,
    })
    .from(missionBulletins)
    .where(
      and(
        eq(missionBulletins.organizationId, requester.organizationId),
        cutoff ? gte(missionBulletins.createdAt, cutoff) : undefined,
      ),
    )
    .orderBy(desc(missionBulletins.isImportant), desc(missionBulletins.createdAt))
    .limit(100);
  const bulletins = await query;

  return NextResponse.json({ bulletins, range });
}

export async function POST(request: Request): Promise<NextResponse> {
  const result = await getRequesterFromRequest(request);
  if ("error" in result) {
    return result.error;
  }
  const { requester, db } = result;

  const body = (await request.json()) as { note?: string; isImportant?: boolean };
  const note = (body.note ?? "").trim();
  const isImportant = body.isImportant === true;
  if (!note) {
    return NextResponse.json({ error: "note is required." }, { status: 400 });
  }

  const inserted = await db
    .insert(missionBulletins)
    .values({
      organizationId: requester.organizationId,
      note: note.slice(0, 4000),
      isImportant,
      createdByMemberId: requester.id,
      createdByDisplayName: requester.displayName,
    })
    .returning({
      id: missionBulletins.id,
      note: missionBulletins.note,
      isImportant: missionBulletins.isImportant,
      createdByDisplayName: missionBulletins.createdByDisplayName,
      createdAt: missionBulletins.createdAt,
    });

  return NextResponse.json({ bulletin: inserted[0] }, { status: 201 });
}
