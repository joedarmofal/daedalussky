import { and, eq } from "drizzle-orm";
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

type Params = { params: Promise<{ hazardId: string }> };

export async function PATCH(request: Request, context: Params): Promise<NextResponse> {
  const result = await getRequester();
  if (result.error) {
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
