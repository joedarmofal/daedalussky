"use client";

import { onAuthStateChanged } from "firebase/auth";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

import { getFirebaseAuth } from "@firebase-config";

/** Paths that do not require a Firebase session (prefix match after exact `/`). */
function isPublicPath(pathname: string | null): boolean {
  if (!pathname) {
    return false;
  }
  if (pathname === "/") {
    return true;
  }
  if (pathname.startsWith("/login")) {
    return true;
  }
  if (pathname.startsWith("/auth")) {
    return true;
  }
  if (pathname.startsWith("/pulse-check/s/")) {
    return true;
  }
  return false;
}

export type AuthGuardProps = {
  children: ReactNode;
};

/**
 * Client-side Firebase auth gate for the App Router. Wrap a `layout.tsx` (or a
 * single page) for sections that should redirect anonymous users to `/login`.
 *
 * Does not call Firebase during SSR — waits for `onAuthStateChanged` on the client.
 */
export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const publicRoute = isPublicPath(pathname);

  const [allow, setAllow] = useState(publicRoute);

  useEffect(() => {
    if (publicRoute) {
      setAllow(true);
      return;
    }

    setAllow(false);
    const auth = getFirebaseAuth();
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) {
        const dest = pathname && pathname !== "/" ? pathname : "/mission-control";
        router.replace(`/login?redirect=${encodeURIComponent(dest)}`);
        setAllow(false);
        return;
      }
      setAllow(true);
    });
    return () => unsub();
  }, [publicRoute, pathname, router]);

  if (!allow) {
    return (
      <div
        className="flex min-h-[40vh] flex-1 items-center justify-center text-sm text-neutral-500"
        aria-busy="true"
        aria-live="polite"
      >
        Checking sign-in…
      </div>
    );
  }

  return <>{children}</>;
}
