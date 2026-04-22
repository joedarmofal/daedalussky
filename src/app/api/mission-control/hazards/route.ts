import { and, desc, eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getDb } from "@/db";
import { members } from "@/db/schema/members";
import { missionHazards } from "@/db/schema/mission-hazards";
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
      role: members.role,
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
  const view = searchParams.get("view") === "archive" ? "archive" : "current";
  const status = view === "archive" ? "resolved" : "current";

  const hazards = await db
    .select({
      id: missionHazards.id,
      title: missionHazards.title,
      details: missionHazards.details,
      status: missionHazards.status,
      createdAt: missionHazards.createdAt,
      resolvedAt: missionHazards.resolvedAt,
    })
    .from(missionHazards)
    .where(
      and(
        eq(missionHazards.organizationId, requester.organizationId),
        eq(missionHazards.status, status),
      ),
    )
    .orderBy(desc(missionHazards.createdAt));

  return NextResponse.json({ hazards, view });
}

export async function POST(request: Request): Promise<NextResponse> {
  const result = await getRequester();
  if (result.error) {
    return result.error;
  }
  const { requester, db } = result;

  const body = (await request.json()) as { title?: string; details?: string };
  const title = (body.title ?? "").trim();
  const details = (body.details ?? "").trim();
  if (!title) {
    return NextResponse.json({ error: "title is required." }, { status: 400 });
  }

  const inserted = await db
    .insert(missionHazards)
    .values({
      organizationId: requester.organizationId,
      title: title.slice(0, 140),
      details: details ? details.slice(0, 4000) : null,
      status: "current",
      createdByMemberId: requester.id,
    })
    .returning({
      id: missionHazards.id,
      title: missionHazards.title,
      details: missionHazards.details,
      status: missionHazards.status,
      createdAt: missionHazards.createdAt,
      resolvedAt: missionHazards.resolvedAt,
    });

  return NextResponse.json({ hazard: inserted[0] }, { status: 201 });
}
