import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

import { getPublicEnv } from "@/lib/public-env";

console.log("Initializing Services...", { service: "firebase-web" });

export type FirebaseWebConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
};

const REQUIRED_WEB_KEYS = [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID",
] as const;

export type FirebaseWebInitResult =
  | { ok: true; config: FirebaseWebConfig }
  | { ok: false; missingKeys: string[] };

function parseFirebaseWebConfig(): FirebaseWebInitResult {
  const apiKey = getPublicEnv("NEXT_PUBLIC_FIREBASE_API_KEY");
  const authDomain = getPublicEnv("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN");
  const projectId = getPublicEnv("NEXT_PUBLIC_FIREBASE_PROJECT_ID");
  const storageBucket = getPublicEnv("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET");
  const messagingSenderId = getPublicEnv("NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID");
  const appId = getPublicEnv("NEXT_PUBLIC_FIREBASE_APP_ID");

  if (apiKey && authDomain && projectId && storageBucket && messagingSenderId && appId) {
    return {
      ok: true,
      config: {
        apiKey,
        authDomain,
        projectId,
        storageBucket,
        messagingSenderId,
        appId,
      },
    };
  }

  const bundled = getPublicEnv("NEXT_PUBLIC_FIREBASE_CONFIG").trim();
  if (bundled) {
    try {
      const parsed = JSON.parse(bundled) as Partial<FirebaseWebConfig>;
      if (
        parsed.apiKey &&
        parsed.authDomain &&
        parsed.projectId &&
        parsed.storageBucket &&
        parsed.messagingSenderId &&
        parsed.appId
      ) {
        return { ok: true, config: parsed as FirebaseWebConfig };
      }
    } catch {
      const missing = [...REQUIRED_WEB_KEYS].filter((k) => !getPublicEnv(k));
      return { ok: false, missingKeys: [...missing, "NEXT_PUBLIC_FIREBASE_CONFIG (invalid JSON)"] };
    }
  }

  const missingKeys = [...REQUIRED_WEB_KEYS].filter((k) => !getPublicEnv(k));
  return { ok: false, missingKeys };
}

const firebaseWebInit: FirebaseWebInitResult = parseFirebaseWebConfig();

if (!firebaseWebInit.ok && typeof console !== "undefined") {
  console.error("Firebase web missing critical keys:", firebaseWebInit.missingKeys);
}

export function isFirebaseWebConfigured(): boolean {
  return firebaseWebInit.ok;
}

export function getFirebaseWebInitResult(): FirebaseWebInitResult {
  return firebaseWebInit;
}

export function getMissingFirebaseWebEnvNames(): string[] {
  return firebaseWebInit.ok ? [] : [...firebaseWebInit.missingKeys];
}

let browserApp: FirebaseApp | null = null;
let browserAuth: Auth | null = null;
let browserDb: Firestore | null = null;

/** Firebase web app (browser only). Returns null when env is not configured. */
export function getFirebaseApp(): FirebaseApp | null {
  if (typeof window === "undefined") {
    return null;
  }
  if (!firebaseWebInit.ok) {
    return null;
  }
  if (!browserApp) {
    browserApp = getApps().length > 0 ? getApps()[0]! : initializeApp(firebaseWebInit.config);
  }
  return browserApp;
}

/** Shared Firebase Auth instance (browser only). Null when not configured. */
export function getFirebaseAuth(): Auth | null {
  const app = getFirebaseApp();
  if (!app) {
    return null;
  }
  if (!browserAuth) {
    browserAuth = getAuth(app);
  }
  return browserAuth;
}

/** Shared Cloud Firestore instance (browser only). Null when not configured. */
export function getFirebaseDb(): Firestore | null {
  const app = getFirebaseApp();
  if (!app) {
    return null;
  }
  if (!browserDb) {
    browserDb = getFirestore(app);
  }
  return browserDb;
}

export { getFirebaseAuth as firebaseAuth };
