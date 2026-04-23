import { and, desc, eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";

import { debriefEntries } from "@/db/schema/debrief-entries";
import { members } from "@/db/schema/members";
import type { DebriefModule } from "@/lib/debriefing/types";
import { getRequesterFromRequest } from "@/lib/api-auth";
import { sendDebriefEscalationEmail } from "@/lib/notifications/debrief-escalation";

const ALLOWED_MODULES = new Set<DebriefModule>([
  "Clinical",
  "Aviation",
  "Communication Center",
]);

export async function GET(request: Request): Promise<NextResponse> {
  const result = await getRequesterFromRequest(request);
  if ("error" in result) {
    return result.error;
  }
  const { requester, db } = result;

  const entries = await db
    .select({
      id: debriefEntries.id,
      module: debriefEntries.module,
      tripNumber: debriefEntries.tripNumber,
      entryDate: debriefEntries.entryDate,
      crewMemberIds: debriefEntries.crewMemberIds,
      answers: debriefEntries.answers,
      concernEscalated: debriefEntries.concernEscalated,
      concernSummary: debriefEntries.concernSummary,
      taggedMemberId: debriefEntries.taggedMemberId,
      taggedMemberEmail: debriefEntries.taggedMemberEmail,
      notificationStatus: debriefEntries.notificationStatus,
      status: debriefEntries.status,
      createdAt: debriefEntries.createdAt,
      updatedAt: debriefEntries.updatedAt,
    })
    .from(debriefEntries)
    .where(eq(debriefEntries.organizationId, requester.organizationId))
    .orderBy(desc(debriefEntries.updatedAt));

  return NextResponse.json({ entries });
}

export async function POST(request: Request): Promise<NextResponse> {
  const result = await getRequesterFromRequest(request);
  if ("error" in result) {
    return result.error;
  }
  const { requester, db } = result;

  const body = (await request.json()) as {
    module?: string;
    tripNumber?: string;
    entryDate?: string;
    crewMemberIds?: string[];
    answers?: Record<string, string>;
    status?: string;
    concernEscalated?: boolean;
    concernSummary?: string;
    taggedMemberId?: string;
  };

  const moduleName = (body.module ?? "").trim() as DebriefModule;
  const tripNumber = (body.tripNumber ?? "").trim();
  const entryDate = (body.entryDate ?? "").trim();
  const status = (body.status ?? "draft").trim() || "draft";
  const crewMemberIds = Array.isArray(body.crewMemberIds)
    ? body.crewMemberIds.map((id) => id.trim()).filter(Boolean)
    : [];
  const answers = body.answers ?? {};
  const concernEscalated = body.concernEscalated === true;
  const concernSummary = (body.concernSummary ?? "").trim();
  const taggedMemberId = (body.taggedMemberId ?? "").trim();

  if (!ALLOWED_MODULES.has(moduleName)) {
    return NextResponse.json({ error: "Invalid debrief module." }, { status: 400 });
  }
  if (!tripNumber || !entryDate) {
    return NextResponse.json(
      { error: "tripNumber and entryDate are required." },
      { status: 400 },
    );
  }
  if (concernEscalated && !concernSummary) {
    return NextResponse.json(
      { error: "Concern summary is required when escalating." },
      { status: 400 },
    );
  }
  if (concernEscalated && !taggedMemberId) {
    return NextResponse.json(
      { error: "You must tag a member for escalated concerns." },
      { status: 400 },
    );
  }

  if (crewMemberIds.length > 0) {
    const orgMembers = await db
      .select({ id: members.id })
      .from(members)
      .where(
        and(
          eq(members.organizationId, requester.organizationId),
          inArray(members.id, crewMemberIds),
        ),
      );
    const allowedIds = new Set(orgMembers.map((m) => m.id));
    const invalid = crewMemberIds.find((id) => !allowedIds.has(id));
    if (invalid) {
      return NextResponse.json(
        { error: "One or more crew members are outside your organization." },
        { status: 400 },
      );
    }
  }

  let taggedMemberEmail: string | null = null;
  let taggedMemberName = "";
  if (concernEscalated) {
    const taggedRows = await db
      .select({
        id: members.id,
        email: members.email,
        displayName: members.displayName,
      })
      .from(members)
      .where(
        and(
          eq(members.organizationId, requester.organizationId),
          eq(members.id, taggedMemberId),
        ),
      )
      .limit(1);
    const tagged = taggedRows[0];
    if (!tagged) {
      return NextResponse.json(
        { error: "Tagged member is invalid for this organization." },
        { status: 400 },
      );
    }
    if (!tagged.email) {
      return NextResponse.json(
        { error: "Tagged member does not have an email on file." },
        { status: 400 },
      );
    }
    taggedMemberEmail = tagged.email;
    taggedMemberName = tagged.displayName;
  }

  let notificationStatus = "not_requested";
  if (concernEscalated && taggedMemberEmail) {
    notificationStatus = await sendDebriefEscalationEmail({
      to: taggedMemberEmail,
      taggedMemberName,
      reporterName: requester.displayName,
      moduleName,
      tripNumber,
      entryDate,
      concernSummary,
    });
  }

  const inserted = await db
    .insert(debriefEntries)
    .values({
      organizationId: requester.organizationId,
      module: moduleName,
      tripNumber,
      entryDate,
      crewMemberIds,
      answers,
      concernEscalated: concernEscalated ? "true" : "false",
      concernSummary: concernSummary || null,
      taggedMemberId: taggedMemberId || null,
      taggedMemberEmail,
      notificationStatus,
      status,
      createdByMemberId: requester.id,
    })
    .returning({
      id: debriefEntries.id,
      module: debriefEntries.module,
      tripNumber: debriefEntries.tripNumber,
      entryDate: debriefEntries.entryDate,
      crewMemberIds: debriefEntries.crewMemberIds,
      answers: debriefEntries.answers,
      concernEscalated: debriefEntries.concernEscalated,
      concernSummary: debriefEntries.concernSummary,
      taggedMemberId: debriefEntries.taggedMemberId,
      taggedMemberEmail: debriefEntries.taggedMemberEmail,
      notificationStatus: debriefEntries.notificationStatus,
      status: debriefEntries.status,
      createdAt: debriefEntries.createdAt,
      updatedAt: debriefEntries.updatedAt,
    });

  return NextResponse.json({ entry: inserted[0] }, { status: 201 });
}
