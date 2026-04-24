import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { members } from "@/db/schema/members";
import { organizations } from "@/db/schema/organizations";
import { getRequesterFromRequest } from "@/lib/api-auth";

export async function GET(request: Request): Promise<NextResponse> {
  const result = await getRequesterFromRequest(request);
  if ("error" in result) {
    return result.error;
  }
  const { requester, db } = result;

  const memberRows = await db
    .select({
      id: members.id,
      organizationId: members.organizationId,
      displayName: members.displayName,
      email: members.email,
      role: members.role,
      status: members.status,
      position: members.position,
      mobileNumber: members.mobileNumber,
      mobileCarrier: members.mobileCarrier,
      flightSuitSize: members.flightSuitSize,
      tShirtSize: members.tShirtSize,
      gender: members.gender,
      employeeId: members.employeeId,
      emergencyContactName: members.emergencyContactName,
      emergencyContactPhone: members.emergencyContactPhone,
      emergencyContactAddress: members.emergencyContactAddress,
      photoDataUrl: members.photoDataUrl,
    })
    .from(members)
    .where(and(eq(members.id, requester.id), eq(members.organizationId, requester.organizationId)))
    .limit(1);

  const member = memberRows[0];
  if (!member) {
    return NextResponse.json({ error: "Member not found." }, { status: 404 });
  }

  const orgRows = await db
    .select({
      id: organizations.id,
      slug: organizations.slug,
      displayName: organizations.displayName,
      legalName: organizations.legalName,
      status: organizations.status,
    })
    .from(organizations)
    .where(eq(organizations.id, requester.organizationId))
    .limit(1);

  const organization = orgRows[0];
  if (!organization) {
    return NextResponse.json({ error: "Organization not found." }, { status: 404 });
  }

  return NextResponse.json({ member, organization });
}
