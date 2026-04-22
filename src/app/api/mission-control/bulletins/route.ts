import { and, desc, eq, gte } from "drizzle-orm";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getDb } from "@/db";
import { members } from "@/db/schema/members";
import { missionBulletins } from "@/db/schema/mission-bulletins";
import { createClient } from "@/utils/supabase/server";

async function getRequester() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const db = getDb();
  const requesterRows = await db
    .select({
      id: members.id,
      organizationId: members.organizationId,
      displayName: members.displayName,
    })
    .from(members)
    .where(eq(members.authSubject, user.id))
    .limit(1);
  const requester = requesterRows[0];
  if (!requester) {
    return {
      error: NextResponse.json(
        { error: "No member row mapped to this auth user." },
        { status: 403 },
      ),
    };
  }

  return { requester, db };
}

export async function GET(request: Request): Promise<NextResponse> {
  const result = await getRequester();
  if (result.error) {
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
  const result = await getRequester();
  if (result.error) {
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
