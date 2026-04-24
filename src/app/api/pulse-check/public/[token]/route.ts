import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { pulseCheckLinks, pulseCheckResponses } from "@/db/schema/pulse-check";
import { getRequesterFromRequest } from "@/lib/api-auth";

type Params = { params: Promise<{ token: string }> };

export async function GET(request: Request, context: Params): Promise<NextResponse> {
  const auth = await getRequesterFromRequest(request);
  if ("error" in auth) {
    return auth.error;
  }
  const { requester, db } = auth;

  const { token } = await context.params;
  const rows = await db
    .select({
      id: pulseCheckLinks.id,
      tripNumber: pulseCheckLinks.tripNumber,
      status: pulseCheckLinks.status,
    })
    .from(pulseCheckLinks)
    .where(
      and(
        eq(pulseCheckLinks.token, token),
        eq(pulseCheckLinks.organizationId, requester.organizationId),
      ),
    )
    .limit(1);
  const link = rows[0];
  if (!link || link.status !== "active") {
    return NextResponse.json({ error: "Survey link is unavailable." }, { status: 404 });
  }

  return NextResponse.json({ link });
}

export async function POST(request: Request, context: Params): Promise<NextResponse> {
  const auth = await getRequesterFromRequest(request);
  if ("error" in auth) {
    return auth.error;
  }
  const { requester, db } = auth;

  const { token } = await context.params;
  const body = (await request.json()) as {
    overallRating?: number;
    communicationRating?: number;
    professionalismRating?: number;
    wouldRecommend?: string;
    comments?: string;
    respondentEmail?: string;
  };

  const overallRating = Number(body.overallRating);
  const communicationRating =
    body.communicationRating === undefined ? null : Number(body.communicationRating);
  const professionalismRating =
    body.professionalismRating === undefined ? null : Number(body.professionalismRating);
  const wouldRecommend = (body.wouldRecommend ?? "").trim().toLowerCase();
  const comments = (body.comments ?? "").trim().slice(0, 2000);
  const respondentEmail = (body.respondentEmail ?? "").trim().slice(0, 320);

  if (!Number.isInteger(overallRating) || overallRating < 1 || overallRating > 5) {
    return NextResponse.json({ error: "overallRating must be 1-5." }, { status: 400 });
  }
  if (
    communicationRating !== null &&
    (!Number.isInteger(communicationRating) || communicationRating < 1 || communicationRating > 5)
  ) {
    return NextResponse.json({ error: "communicationRating must be 1-5." }, { status: 400 });
  }
  if (
    professionalismRating !== null &&
    (!Number.isInteger(professionalismRating) || professionalismRating < 1 || professionalismRating > 5)
  ) {
    return NextResponse.json({ error: "professionalismRating must be 1-5." }, { status: 400 });
  }
  if (!(wouldRecommend === "yes" || wouldRecommend === "no")) {
    return NextResponse.json({ error: "wouldRecommend must be yes/no." }, { status: 400 });
  }

  const rows = await db
    .select({
      id: pulseCheckLinks.id,
      status: pulseCheckLinks.status,
    })
    .from(pulseCheckLinks)
    .where(
      and(
        eq(pulseCheckLinks.token, token),
        eq(pulseCheckLinks.organizationId, requester.organizationId),
      ),
    )
    .limit(1);
  const link = rows[0];
  if (!link || link.status !== "active") {
    return NextResponse.json({ error: "Survey link is unavailable." }, { status: 404 });
  }

  await db.insert(pulseCheckResponses).values({
    linkId: link.id,
    overallRating,
    communicationRating,
    professionalismRating,
    wouldRecommend,
    comments: comments || null,
    respondentEmail: respondentEmail || null,
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
