import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // 1. Define routes that STRICTLY require a Supabase token refresh to even look at
  const isProtectedRoute = path.startsWith('/mission-control') || path.startsWith('/admin');

  // 2. Only run the Supabase check on those specific routes
  if (isProtectedRoute) {
    return await updateSession(request);
  }

  // 3. For everything else (home, public access pages), just let them through!
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
