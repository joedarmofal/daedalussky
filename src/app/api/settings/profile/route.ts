import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { members } from "@/db/schema/members";
import { getRequesterFromRequest } from "@/lib/api-auth";

export async function PATCH(request: Request): Promise<NextResponse> {
  const result = await getRequesterFromRequest(request);
  if ("error" in result) {
    return result.error;
  }
  const { requester, db } = result;

  const body = (await request.json()) as {
    displayName?: string;
    position?: string | null;
    mobileNumber?: string | null;
    mobileCarrier?: string | null;
    flightSuitSize?: string | null;
    tShirtSize?: string | null;
    gender?: string | null;
    employeeId?: string | null;
    emergencyContactName?: string | null;
    emergencyContactPhone?: string | null;
    emergencyContactAddress?: string | null;
    photoDataUrl?: string | null;
  };

  const patch: Partial<typeof members.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (body.displayName !== undefined) {
    const v = body.displayName.trim();
    if (!v) {
      return NextResponse.json({ error: "displayName cannot be empty." }, { status: 400 });
    }
    patch.displayName = v;
  }
  if (body.position !== undefined) {
    patch.position = body.position?.trim() || null;
  }
  if (body.mobileNumber !== undefined) {
    patch.mobileNumber = body.mobileNumber?.trim() || null;
  }
  if (body.mobileCarrier !== undefined) {
    patch.mobileCarrier = body.mobileCarrier?.trim() || null;
  }
  if (body.flightSuitSize !== undefined) {
    patch.flightSuitSize = body.flightSuitSize?.trim() || null;
  }
  if (body.tShirtSize !== undefined) {
    patch.tShirtSize = body.tShirtSize?.trim() || null;
  }
  if (body.gender !== undefined) {
    patch.gender = body.gender?.trim() || null;
  }
  if (body.employeeId !== undefined) {
    patch.employeeId = body.employeeId?.trim() || null;
  }
  if (body.emergencyContactName !== undefined) {
    patch.emergencyContactName = body.emergencyContactName?.trim() || null;
  }
  if (body.emergencyContactPhone !== undefined) {
    patch.emergencyContactPhone = body.emergencyContactPhone?.trim() || null;
  }
  if (body.emergencyContactAddress !== undefined) {
    patch.emergencyContactAddress = body.emergencyContactAddress?.trim() || null;
  }
  if (body.photoDataUrl !== undefined) {
    patch.photoDataUrl = body.photoDataUrl?.trim() || null;
  }

  if (Object.keys(patch).length <= 1) {
    return NextResponse.json({ error: "No valid fields to update." }, { status: 400 });
  }

  const updated = await db
    .update(members)
    .set(patch)
    .where(and(eq(members.id, requester.id), eq(members.organizationId, requester.organizationId)))
    .returning({
      id: members.id,
      displayName: members.displayName,
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
      updatedAt: members.updatedAt,
    });

  const row = updated[0];
  if (!row) {
    return NextResponse.json({ error: "Could not update profile." }, { status: 500 });
  }

  return NextResponse.json({ member: row });
}
