"use client";

import { onAuthStateChanged } from "firebase/auth";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

import {
  getFirebaseAuth,
  getMissingFirebaseWebEnvNames,
  isFirebaseWebConfigured,
} from "@firebase-config";
import { FirebaseConfigurationError } from "@/components/FirebaseConfigurationError";

/** Password reset and similar — no session required. */
function isPublicAnonPath(pathname: string | null): boolean {
  if (!pathname) {
    return false;
  }
  if (pathname.startsWith("/auth")) {
    return true;
  }
  return false;
}

function isLoginPath(pathname: string | null): boolean {
  if (!pathname) {
    return false;
  }
  if (pathname === "/") {
    return true;
  }
  if (pathname === "/login") {
    return true;
  }
  return false;
}

function safeInternalPath(path: string | null): string | null {
  if (!path || !path.startsWith("/") || path.startsWith("//")) {
    return null;
  }
  return path;
}

function postLoginDestination(redirectParam: string | null): string {
  return safeInternalPath(redirectParam) ?? "/mission-control";
}

export type AuthGuardProps = {
  children: ReactNode;
};

/**
 * Client-side Firebase gate: sign-in lives at `/` (and legacy `/login` redirects).
 * Authenticated users hitting login paths go to Mission Control (or `?redirect=`).
 * Anonymous users on protected routes go to `/?redirect=…`.
 */
export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const anonPublic = isPublicAnonPath(pathname);
  const loginPath = isLoginPath(pathname);
  const queryString = searchParams.toString();

  const [allow, setAllow] = useState(anonPublic);
  const firebaseConfigured = isFirebaseWebConfigured();

  useEffect(() => {
    if (!firebaseConfigured) {
      return;
    }
    if (anonPublic) {
      setAllow(true);
      return;
    }

    const auth = getFirebaseAuth();
    if (!auth) {
      return;
    }
    const unsub = onAuthStateChanged(auth, (user) => {
      if (loginPath) {
        if (user) {
          const next = postLoginDestination(searchParams.get("redirect"));
          router.replace(next);
          setAllow(false);
          return;
        }
        setAllow(true);
        return;
      }

      if (!user) {
        const dest = `${pathname}${queryString ? `?${queryString}` : ""}`;
        router.replace(`/?redirect=${encodeURIComponent(dest)}`);
        setAllow(false);
        return;
      }

      setAllow(true);
    });

    return () => unsub();
  }, [anonPublic, firebaseConfigured, loginPath, pathname, queryString, router, searchParams]);

  if (!firebaseConfigured) {
    return <FirebaseConfigurationError missingKeys={getMissingFirebaseWebEnvNames()} />;
  }

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
