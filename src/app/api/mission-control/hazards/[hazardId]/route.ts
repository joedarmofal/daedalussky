import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { missionHazards } from "@/db/schema/mission-hazards";
import { getRequesterFromRequest } from "@/lib/api-auth";

type Params = { params: Promise<{ hazardId: string }> };

export async function PATCH(request: Request, context: Params): Promise<NextResponse> {
  const result = await getRequesterFromRequest(request);
  if ("error" in result) {
    return result.error;
  }
  const { requester, db } = result;
  const { hazardId } = await context.params;
  const body = (await request.json()) as { status?: "current" | "resolved" };

  if (!(body.status === "current" || body.status === "resolved")) {
    return NextResponse.json(
      { error: "status must be current or resolved." },
      { status: 400 },
    );
  }

  const updated = await db
    .update(missionHazards)
    .set({
      status: body.status,
      resolvedAt: body.status === "resolved" ? new Date() : null,
      resolvedByMemberId: body.status === "resolved" ? requester.id : null,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(missionHazards.id, hazardId),
        eq(missionHazards.organizationId, requester.organizationId),
      ),
    )
    .returning({
      id: missionHazards.id,
      title: missionHazards.title,
      details: missionHazards.details,
      status: missionHazards.status,
      createdAt: missionHazards.createdAt,
      resolvedAt: missionHazards.resolvedAt,
    });

  if (!updated[0]) {
    return NextResponse.json({ error: "Hazard not found." }, { status: 404 });
  }

  return NextResponse.json({ hazard: updated[0] });
}
