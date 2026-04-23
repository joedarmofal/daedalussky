import "server-only";

import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { getDb } from "@/db";
import { members } from "@/db/schema/members";
import { verifyFirebaseIdToken } from "@firebase-admin";

export type ApiRequester = {
  id: string;
  organizationId: string;
  role: string;
  displayName: string;
  status: string;
};

export async function getRequesterFromRequest(request: Request): Promise<
  | { requester: ApiRequester; db: ReturnType<typeof getDb> }
  | { error: NextResponse }
> {
  const authHeader = request.headers.get("authorization");
  const token =
    authHeader?.startsWith("Bearer ") ? authHeader.slice("Bearer ".length).trim() : null;
  if (!token) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  let uid: string;
  try {
    const decoded = await verifyFirebaseIdToken(token);
    uid = decoded.uid;
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (message.includes("FIREBASE_SERVICE_ACCOUNT_JSON")) {
      return {
        error: NextResponse.json(
          { error: "Server Firebase admin is not configured." },
          { status: 503 },
        ),
      };
    }
    return {
      error: NextResponse.json({ error: "Invalid or expired token." }, { status: 401 }),
    };
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
    .where(eq(members.authSubject, uid))
    .limit(1);

  const requester = requesterRows[0];
  if (!requester) {
    return {
      error: NextResponse.json(
        {
          error:
            "No member profile mapped to this Firebase user. Set members.auth_subject to the Firebase Auth UID.",
        },
        { status: 403 },
      ),
    };
  }

  return { requester, db };
}
