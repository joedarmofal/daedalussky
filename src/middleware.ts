import { type NextRequest, NextResponse } from "next/server";

import { isAuthDevBypassEnabled } from "@/lib/auth-dev-bypass";
import { FIREBASE_SESSION_COOKIE_NAME } from "@/lib/firebase-session-cookie";
import { getPublicEnv } from "@/lib/public-env";
import { verifyFirebaseIdToken, verifyFirebaseSessionCookie } from "@/lib/verify-firebase-jwt-edge";

function isStaticAsset(pathname: string): boolean {
  return (
    pathname.startsWith("/_next/") ||
    pathname === "/favicon.ico" ||
    /\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$/i.test(pathname)
  );
}

function isPublicPage(pathname: string): boolean {
  if (pathname === "/" || pathname === "/login") {
    return true;
  }
  if (pathname.startsWith("/auth")) {
    return true;
  }
  return false;
}

function isPublicApi(pathname: string): boolean {
  if (pathname === "/api/auth/session") {
    return true;
  }
  if (pathname === "/api/health") {
    return true;
  }
  return false;
}

function safeRedirectPath(path: string | null): string | null {
  if (!path || !path.startsWith("/") || path.startsWith("//")) {
    return null;
  }
  return path;
}

async function hasValidApiAuth(request: NextRequest, projectId: string): Promise<boolean> {
  const session = request.cookies.get(FIREBASE_SESSION_COOKIE_NAME)?.value;
  if (session && (await verifyFirebaseSessionCookie(session, projectId))) {
    return true;
  }
  const authz = request.headers.get("authorization");
  if (authz?.startsWith("Bearer ")) {
    const raw = authz.slice("Bearer ".length).trim();
    if (raw && (await verifyFirebaseIdToken(raw, projectId))) {
      return true;
    }
  }
  return false;
}

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  if (isStaticAsset(pathname)) {
    return NextResponse.next();
  }

  if (isAuthDevBypassEnabled()) {
    return NextResponse.next();
  }

  const projectId = getPublicEnv("NEXT_PUBLIC_FIREBASE_PROJECT_ID");
  if (!projectId) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "NEXT_PUBLIC_FIREBASE_PROJECT_ID is not set" }, { status: 500 });
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    if (isPublicApi(pathname)) {
      return NextResponse.next();
    }
    if (!(await hasValidApiAuth(request, projectId))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.next();
  }

  const session = request.cookies.get(FIREBASE_SESSION_COOKIE_NAME)?.value;
  const sessionOk = session ? await verifyFirebaseSessionCookie(session, projectId) : false;

  if (isPublicPage(pathname)) {
    if ((pathname === "/" || pathname === "/login") && sessionOk) {
      const next =
        safeRedirectPath(request.nextUrl.searchParams.get("redirect")) ?? "/mission-control";
      return NextResponse.redirect(new URL(next, request.url));
    }
    return NextResponse.next();
  }

  if (!sessionOk) {
    const dest = `${pathname}${request.nextUrl.search}`;
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    url.searchParams.set("redirect", dest);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
