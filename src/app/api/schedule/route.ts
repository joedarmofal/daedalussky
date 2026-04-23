import { and, desc, eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";

import { members } from "@/db/schema/members";
import { scheduleShifts } from "@/db/schema/schedule-shifts";
import { getRequesterFromRequest } from "@/lib/api-auth";

export async function GET(request: Request): Promise<NextResponse> {
  const result = await getRequesterFromRequest(request);
  if ("error" in result) {
    return result.error;
  }
  const { requester, db } = result;

  const [orgMembers, shifts] = await Promise.all([
    db
      .select({
        id: members.id,
        displayName: members.displayName,
        role: members.role,
        status: members.status,
      })
      .from(members)
      .where(eq(members.organizationId, requester.organizationId))
      .orderBy(members.displayName),
    db
      .select({
        id: scheduleShifts.id,
        shiftDate: scheduleShifts.shiftDate,
        missionLabel: scheduleShifts.missionLabel,
        baseName: scheduleShifts.baseName,
        shiftStart: scheduleShifts.shiftStart,
        shiftEnd: scheduleShifts.shiftEnd,
        crewAssignments: scheduleShifts.crewAssignments,
        notes: scheduleShifts.notes,
        createdAt: scheduleShifts.createdAt,
      })
      .from(scheduleShifts)
      .where(eq(scheduleShifts.organizationId, requester.organizationId))
      .orderBy(desc(scheduleShifts.shiftDate), desc(scheduleShifts.createdAt)),
  ]);

  return NextResponse.json({
    requester,
    members: orgMembers,
    shifts,
  });
}

export async function POST(request: Request): Promise<NextResponse> {
  const result = await getRequesterFromRequest(request);
  if ("error" in result) {
    return result.error;
  }
  const { requester, db } = result;
  if (!(requester.role === "owner" || requester.role === "admin" || requester.role === "dispatcher")) {
    return NextResponse.json(
      { error: "Only owner/admin/dispatcher can create schedule shifts." },
      { status: 403 },
    );
  }

  const body = (await request.json()) as {
    shiftDate?: string;
    missionLabel?: string;
    baseName?: string;
    shiftStart?: string;
    shiftEnd?: string;
    notes?: string;
    crewAssignments?: { role: string; memberId: string }[];
  };

  const shiftDate = (body.shiftDate ?? "").trim();
  const missionLabel = (body.missionLabel ?? "").trim();
  const baseName = (body.baseName ?? "").trim();
  if (!shiftDate || !missionLabel || !baseName) {
    return NextResponse.json(
      { error: "shiftDate, missionLabel, and baseName are required." },
      { status: 400 },
    );
  }

  const assignments = Array.isArray(body.crewAssignments)
    ? body.crewAssignments
        .map((a) => ({ role: a.role?.trim() ?? "", memberId: a.memberId?.trim() ?? "" }))
        .filter((a) => a.role && a.memberId)
    : [];

  if (assignments.length > 0) {
    const memberIds = assignments.map((a) => a.memberId);
    const existingMembers = await db
      .select({ id: members.id })
      .from(members)
      .where(
        and(
          eq(members.organizationId, requester.organizationId),
          inArray(members.id, memberIds),
        ),
      );
    const existingSet = new Set(existingMembers.map((m) => m.id));
    const bad = memberIds.find((id) => !existingSet.has(id));
    if (bad) {
      return NextResponse.json(
        { error: "One or more assigned members are invalid for this organization." },
        { status: 400 },
      );
    }
  }

  const inserted = await db
    .insert(scheduleShifts)
    .values({
      organizationId: requester.organizationId,
      shiftDate,
      missionLabel,
      baseName,
      shiftStart: body.shiftStart?.trim() || null,
      shiftEnd: body.shiftEnd?.trim() || null,
      notes: body.notes?.trim() || null,
      crewAssignments: assignments,
      createdByMemberId: requester.id,
    })
    .returning({
      id: scheduleShifts.id,
      shiftDate: scheduleShifts.shiftDate,
      missionLabel: scheduleShifts.missionLabel,
      baseName: scheduleShifts.baseName,
      shiftStart: scheduleShifts.shiftStart,
      shiftEnd: scheduleShifts.shiftEnd,
      crewAssignments: scheduleShifts.crewAssignments,
      notes: scheduleShifts.notes,
      createdAt: scheduleShifts.createdAt,
    });

  return NextResponse.json({ shift: inserted[0] }, { status: 201 });
}
