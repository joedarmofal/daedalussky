import { NextResponse } from "next/server";

import { getAdminAuth } from "@firebase-admin";
import {
  FIREBASE_SESSION_COOKIE_NAME,
  SESSION_COOKIE_MAX_AGE_MS,
} from "@/lib/firebase-session-cookie";

export async function POST(request: Request): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const idToken =
    typeof body === "object" &&
    body !== null &&
    "idToken" in body &&
    typeof (body as { idToken: unknown }).idToken === "string"
      ? (body as { idToken: string }).idToken.trim()
      : "";

  if (!idToken) {
    return NextResponse.json({ error: "Missing idToken" }, { status: 400 });
  }

  try {
    const sessionCookie = await getAdminAuth().createSessionCookie(idToken, {
      expiresIn: SESSION_COOKIE_MAX_AGE_MS,
    });
    const res = NextResponse.json({ ok: true });
    res.cookies.set(FIREBASE_SESSION_COOKIE_NAME, sessionCookie, {
      httpOnly: true,
      maxAge: Math.floor(SESSION_COOKIE_MAX_AGE_MS / 1000),
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });
    return res;
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (message.includes("FIREBASE_SERVICE_ACCOUNT_JSON")) {
      return NextResponse.json({ error: "Server Firebase admin is not configured." }, { status: 503 });
    }
    return NextResponse.json({ error: "Invalid or expired ID token" }, { status: 401 });
  }
}

export async function DELETE(): Promise<NextResponse> {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(FIREBASE_SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    maxAge: 0,
    path: "/",
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });
  return res;
}
