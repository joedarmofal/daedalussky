/**
 * Firebase Admin SDK — **server only** (Next.js Route Handlers, Server Actions, Cloud Functions).
 * Do not import from client components or shared modules used by the browser bundle.
 */
import "server-only";

import { cert, getApps, initializeApp, type App, type ServiceAccount } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

function parseServiceAccountFromEnv(): ServiceAccount {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  if (!raw) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_JSON is not set. Server-side API routes cannot verify Firebase ID tokens without it.",
    );
  }
  return JSON.parse(raw) as ServiceAccount;
}

/** Ensures the default Firebase Admin app exists (singleton). Uses env JSON only — no filesystem paths. */
export function ensureAdminApp(): App {
  const existing = getApps()[0];
  if (existing) {
    return existing;
  }
  const serviceAccount = parseServiceAccountFromEnv();
  return initializeApp({ credential: cert(serviceAccount) });
}

let adminAuthSingleton: Auth | null = null;
let adminDbSingleton: Firestore | null = null;

/** Firebase Admin Auth (default app). */
export function getAdminAuth(): Auth {
  if (!adminAuthSingleton) {
    ensureAdminApp();
    adminAuthSingleton = getAuth();
  }
  return adminAuthSingleton;
}

/** Firebase Admin Firestore (default app). */
export function getAdminDb(): Firestore {
  if (!adminDbSingleton) {
    ensureAdminApp();
    adminDbSingleton = getFirestore();
  }
  return adminDbSingleton;
}

/**
 * Same as `getAdminAuth` / `getAdminDb` — call `adminAuth()` / `adminDb()` for the instances.
 */
export { getAdminAuth as adminAuth, getAdminDb as adminDb };

export async function verifyFirebaseIdToken(idToken: string) {
  return getAdminAuth().verifyIdToken(idToken);
}
