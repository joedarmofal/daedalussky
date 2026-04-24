"use client";

import { onIdTokenChanged } from "firebase/auth";
import { useEffect } from "react";

import { getFirebaseAuth } from "@firebase-config";

/**
 * Refreshes the httpOnly Firebase session cookie whenever the ID token rotates,
 * so middleware and API auth stay aligned with the client session.
 */
export function SessionCookieSync(): null {
  useEffect(() => {
    const auth = getFirebaseAuth();
    return onIdTokenChanged(auth, async (user) => {
      if (!user) {
        return;
      }
      try {
        const idToken = await user.getIdToken();
        await fetch("/api/auth/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ idToken }),
        });
      } catch {
        // Non-fatal; user may retry by navigating or signing in again.
      }
    });
  }, []);

  return null;
}
