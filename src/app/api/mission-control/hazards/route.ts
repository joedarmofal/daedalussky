import { and, desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { missionHazards } from "@/db/schema/mission-hazards";
import { getRequesterFromRequest } from "@/lib/api-auth";

export async function GET(request: Request): Promise<NextResponse> {
  const result = await getRequesterFromRequest(request);
  if ("error" in result) {
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
  const result = await getRequesterFromRequest(request);
  if ("error" in result) {
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
