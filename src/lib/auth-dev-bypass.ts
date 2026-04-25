/**
 * Development-only auth bypass. Never set `NEXT_PUBLIC_AUTH_DEV_BYPASS` in production.
 *
 * When enabled:
 * - `AuthGuard` does not gate on Firebase sign-in
 * - `middleware` does not redirect or require session for pages/APIs
 * - `getRequesterFromRequest` may use `AUTH_DEV_BYPASS_FIREBASE_UID` when no Bearer token is sent
 */
export function isAuthDevBypassEnabled(): boolean {
  const v = getAuthDevBypassRaw();
  return v === "true" || v === "1" || v === "yes";
}

export function getAuthDevBypassRaw(): string {
  try {
    if (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_AUTH_DEV_BYPASS) {
      return process.env.NEXT_PUBLIC_AUTH_DEV_BYPASS.trim().toLowerCase();
    }
  } catch {
    // ignore
  }
  return "";
}
