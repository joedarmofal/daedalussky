import { and, desc, eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getDb } from "@/db";
import { memberCertifications } from "@/db/schema/member-certifications";
import { members } from "@/db/schema/members";
import { createClient } from "@/utils/supabase/server";

const CREATOR_ROLES = new Set(["owner", "admin"]);

type MemberRole = "owner" | "admin" | "dispatcher" | "crew" | "medic" | "viewer";
type TeamPosition =
  | "Flight RN"
  | "Flight RT"
  | "Flight Paramedic"
  | "Flight Physician"
  | "Pilot"
  | "Mechanic"
  | "Communication Specialist"
  | "Orientee"
  | "Student"
  | "Leader"
  | "Admin"
  | "Safety"
  | "Aviation"
  | "Educator";
type MobileCarrier = "AT&T" | "Verizon" | "Sprint" | "T-Mobile" | "Other";

const POSITION_OPTIONS = new Set<TeamPosition>([
  "Flight RN",
  "Flight RT",
  "Flight Paramedic",
  "Flight Physician",
  "Pilot",
  "Mechanic",
  "Communication Specialist",
  "Orientee",
  "Student",
  "Leader",
  "Admin",
  "Safety",
  "Aviation",
  "Educator",
]);
const MOBILE_CARRIER_OPTIONS = new Set<MobileCarrier>([
  "AT&T",
  "Verizon",
  "Sprint",
  "T-Mobile",
  "Other",
]);

function normalizeRole(value: string): MemberRole | null {
  const role = value.trim().toLowerCase();
  if (
    role === "owner" ||
    role === "admin" ||
    role === "dispatcher" ||
    role === "crew" ||
    role === "medic" ||
    role === "viewer"
  ) {
    return role;
  }
  return null;
}

function normalizeOptional(value?: string): string | null {
  const v = value?.trim();
  return v ? v : null;
}

function normalizeOptionalDate(value?: string): string | null {
  const v = value?.trim();
  if (!v) {
    return null;
  }
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) {
    return null;
  }
  return v;
}

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
      status: members.status,
    })
    .from(members)
    .where(eq(members.authSubject, user.id))
    .limit(1);

  const requester = requesterRows[0];
  if (!requester) {
    return {
      error: NextResponse.json(
        {
          error:
            "No member profile mapped to this auth user. Create a member row with auth_subject set to the Supabase user id.",
        },
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
  const orgMembers = await db
    .select({
      id: members.id,
      displayName: members.displayName,
      email: members.email,
      role: members.role,
      status: members.status,
      weightKg: members.weightKg,
      weightLbs: members.weightLbs,
      position: members.position,
      dateOfBirth: members.dateOfBirth,
      photoDataUrl: members.photoDataUrl,
      emergencyContactName: members.emergencyContactName,
      emergencyContactPhone: members.emergencyContactPhone,
      emergencyContactAddress: members.emergencyContactAddress,
      employeeId: members.employeeId,
      hireDate: members.hireDate,
      yearsFlightExperience: members.yearsFlightExperience,
      totalYearsExperience: members.totalYearsExperience,
      mobileNumber: members.mobileNumber,
      mobileCarrier: members.mobileCarrier,
      flightSuitSize: members.flightSuitSize,
      tShirtSize: members.tShirtSize,
      gender: members.gender,
      createdAt: members.createdAt,
      authProvider: members.authProvider,
    })
    .from(members)
    .where(eq(members.organizationId, requester.organizationId))
    .orderBy(desc(members.createdAt));

  return NextResponse.json({
    organizationId: requester.organizationId,
    requester: {
      id: requester.id,
      displayName: requester.displayName,
      role: requester.role,
      status: requester.status,
    },
    members: orgMembers,
  });
}

export async function POST(request: Request): Promise<NextResponse> {
  const result = await getRequester();
  if (result.error) {
    return result.error;
  }

  const { requester, db } = result;
  if (!CREATOR_ROLES.has(requester.role)) {
    return NextResponse.json(
      { error: "Only owner/admin can add members." },
      { status: 403 },
    );
  }

  const body = (await request.json()) as {
    displayName?: string;
    email?: string;
    role?: string;
    position?: string;
    dateOfBirth?: string;
    photoPath?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    emergencyContactAddress?: string;
    weightLbs?: number | string;
    employeeId?: string;
    hireDate?: string;
    yearsFlightExperience?: number | string;
    totalYearsExperience?: number | string;
    mobileNumber?: string;
    mobileCarrier?: string;
    flightSuitSize?: string;
    tShirtSize?: string;
    gender?: string;
    certificationType?: string;
    certificationIssueDate?: string;
    certificationExpirationDate?: string;
    certificationIssuingEntity?: string;
    certificationImagePath?: string;
  };

  const displayName = body.displayName?.trim() ?? "";
  const email = body.email?.trim().toLowerCase() ?? "";
  const role = normalizeRole(body.role ?? "");
  const position = normalizeOptional(body.position) as TeamPosition | null;
  const mobileCarrier = normalizeOptional(body.mobileCarrier) as
    | MobileCarrier
    | null;

  if (!displayName || !email || !role) {
    return NextResponse.json(
      { error: "displayName, email, and valid role are required." },
      { status: 400 },
    );
  }
  if (position && !POSITION_OPTIONS.has(position)) {
    return NextResponse.json({ error: "Invalid team position." }, { status: 400 });
  }
  if (mobileCarrier && !MOBILE_CARRIER_OPTIONS.has(mobileCarrier)) {
    return NextResponse.json({ error: "Invalid mobile carrier." }, { status: 400 });
  }

  const dateOfBirth = normalizeOptionalDate(body.dateOfBirth);
  const hireDate = normalizeOptionalDate(body.hireDate);
  const yearsFlightExperience =
    body.yearsFlightExperience === undefined || body.yearsFlightExperience === ""
      ? null
      : Number(body.yearsFlightExperience);
  const totalYearsExperience =
    body.totalYearsExperience === undefined || body.totalYearsExperience === ""
      ? null
      : Number(body.totalYearsExperience);
  const weightLbs =
    body.weightLbs === undefined || body.weightLbs === ""
      ? null
      : Number(body.weightLbs);
  if (
    (yearsFlightExperience !== null && !Number.isFinite(yearsFlightExperience)) ||
    (totalYearsExperience !== null && !Number.isFinite(totalYearsExperience)) ||
    (weightLbs !== null && !Number.isFinite(weightLbs))
  ) {
    return NextResponse.json(
      { error: "Experience and weight values must be numeric." },
      { status: 400 },
    );
  }

  const existing = await db
    .select({ id: members.id })
    .from(members)
    .where(
      and(
        eq(members.organizationId, requester.organizationId),
        eq(members.email, email),
      ),
    )
    .limit(1);
  if (existing.length > 0) {
    return NextResponse.json(
      { error: "A member with this email already exists in your organization." },
      { status: 409 },
    );
  }

  const inserted = await db
    .insert(members)
    .values({
      organizationId: requester.organizationId,
      displayName,
      email,
      position,
      dateOfBirth,
      photoDataUrl: normalizeOptional(body.photoPath),
      emergencyContactName: normalizeOptional(body.emergencyContactName),
      emergencyContactPhone: normalizeOptional(body.emergencyContactPhone),
      emergencyContactAddress: normalizeOptional(body.emergencyContactAddress),
      employeeId: normalizeOptional(body.employeeId),
      hireDate,
      yearsFlightExperience:
        yearsFlightExperience === null ? null : String(yearsFlightExperience),
      totalYearsExperience:
        totalYearsExperience === null ? null : String(totalYearsExperience),
      mobileNumber: normalizeOptional(body.mobileNumber),
      mobileCarrier,
      flightSuitSize: normalizeOptional(body.flightSuitSize),
      tShirtSize: normalizeOptional(body.tShirtSize),
      gender: normalizeOptional(body.gender),
      role,
      status: "invited",
      authProvider: "supabase",
      weightLbs: weightLbs === null ? null : String(weightLbs),
      weightDisplayUnit: "kg",
    })
    .returning({
      id: members.id,
      displayName: members.displayName,
      email: members.email,
      role: members.role,
      status: members.status,
      createdAt: members.createdAt,
    });

  const member = inserted[0];
  if (!member) {
    return NextResponse.json({ error: "Failed to create member." }, { status: 500 });
  }

  const certificationType = normalizeOptional(body.certificationType);
  const certificationIssueDate = normalizeOptionalDate(body.certificationIssueDate);
  const certificationExpirationDate = normalizeOptionalDate(
    body.certificationExpirationDate,
  );
  const certificationIssuingEntity = normalizeOptional(body.certificationIssuingEntity);
  const certificationImageDataUrl = normalizeOptional(body.certificationImagePath);
  if (certificationType) {
    await db.insert(memberCertifications).values({
      memberId: member.id,
      certificationCode: certificationType.toUpperCase().replace(/\s+/g, "_"),
      title: certificationType,
      issuingBody: certificationIssuingEntity,
      effectiveDate: certificationIssueDate,
      expirationDate: certificationExpirationDate,
      certificationImageDataUrl,
      status: "pending_verification",
    });
  }

  return NextResponse.json({ member }, { status: 201 });
}
