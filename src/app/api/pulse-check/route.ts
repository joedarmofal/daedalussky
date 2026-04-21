import { desc, eq, inArray, sql } from "drizzle-orm";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getDb } from "@/db";
import { debriefEntries } from "@/db/schema/debrief-entries";
import { members } from "@/db/schema/members";
import { pulseCheckLinks, pulseCheckResponses } from "@/db/schema/pulse-check";
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
        { error: "No member profile mapped to this auth user." },
        { status: 403 },
      ),
    };
  }

  return { requester, db };
}

export async function GET(): Promise<NextResponse> {
  const result = await getRequester();
  if (result.error) {
    return result.error;
  }
  const { requester, db } = result;

  const [tripRows, linkRows] = await Promise.all([
    db
      .selectDistinct({ tripNumber: debriefEntries.tripNumber })
      .from(debriefEntries)
      .where(eq(debriefEntries.organizationId, requester.organizationId))
      .orderBy(debriefEntries.tripNumber),
    db
      .select({
        id: pulseCheckLinks.id,
        tripNumber: pulseCheckLinks.tripNumber,
        token: pulseCheckLinks.token,
        status: pulseCheckLinks.status,
        createdAt: pulseCheckLinks.createdAt,
      })
      .from(pulseCheckLinks)
      .where(eq(pulseCheckLinks.organizationId, requester.organizationId))
      .orderBy(desc(pulseCheckLinks.createdAt)),
  ]);

  const linkIds = linkRows.map((r) => r.id);
  let responseCounts = new Map<string, number>();
  if (linkIds.length > 0) {
    const countRows = await db
      .select({
        linkId: pulseCheckResponses.linkId,
        count: sql<number>`count(*)::int`,
      })
      .from(pulseCheckResponses)
      .where(inArray(pulseCheckResponses.linkId, linkIds))
      .groupBy(pulseCheckResponses.linkId);
    responseCounts = new Map(countRows.map((r) => [r.linkId, r.count]));
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "";

  return NextResponse.json({
    trips: tripRows.map((r) => r.tripNumber),
    links: linkRows.map((link) => {
      const surveyPath = `/pulse-check/s/${link.token}`;
      const surveyUrl = baseUrl ? `${baseUrl}${surveyPath}` : surveyPath;
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
        surveyUrl,
      )}`;
      return {
        ...link,
        responseCount: responseCounts.get(link.id) ?? 0,
        surveyPath,
        surveyUrl,
        qrUrl,
      };
    }),
  });
}

export async function POST(request: Request): Promise<NextResponse> {
  const result = await getRequester();
  if (result.error) {
    return result.error;
  }
  const { requester, db } = result;
  if (!(requester.role === "owner" || requester.role === "admin" || requester.role === "dispatcher")) {
    return NextResponse.json(
      { error: "Only owner/admin/dispatcher can create pulse check links." },
      { status: 403 },
    );
  }

  const body = (await request.json()) as { tripNumber?: string };
  const tripNumber = (body.tripNumber ?? "").trim();
  if (!tripNumber) {
    return NextResponse.json({ error: "tripNumber is required." }, { status: 400 });
  }

  const token = crypto.randomUUID().replaceAll("-", "");
  const inserted = await db
    .insert(pulseCheckLinks)
    .values({
      organizationId: requester.organizationId,
      tripNumber,
      token,
      status: "active",
      createdByMemberId: requester.id,
    })
    .returning({
      id: pulseCheckLinks.id,
      tripNumber: pulseCheckLinks.tripNumber,
      token: pulseCheckLinks.token,
      status: pulseCheckLinks.status,
      createdAt: pulseCheckLinks.createdAt,
    });

  return NextResponse.json({ link: inserted[0] }, { status: 201 });
}
