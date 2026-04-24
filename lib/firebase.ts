import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

import { getPublicEnv } from "@/lib/public-env";

console.log("Initializing Services...", { service: "firebase-web" });

type FirebaseWebConfig = {
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

function readFirebaseWebConfig(): FirebaseWebConfig | null {
  const apiKey = getPublicEnv("NEXT_PUBLIC_FIREBASE_API_KEY").trim();
  const authDomain = getPublicEnv("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN").trim();
  const projectId = getPublicEnv("NEXT_PUBLIC_FIREBASE_PROJECT_ID").trim();
  const storageBucket = getPublicEnv("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET").trim();
  const messagingSenderId = getPublicEnv("NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID").trim();
  const appId = getPublicEnv("NEXT_PUBLIC_FIREBASE_APP_ID").trim();

  if (!apiKey || !authDomain || !projectId || !storageBucket || !messagingSenderId || !appId) {
    return null;
  }

  return {
    apiKey,
    authDomain,
    projectId,
    storageBucket,
    messagingSenderId,
    appId,
  };
}

const firebaseWebConfig = readFirebaseWebConfig();

if (!firebaseWebConfig) {
  const missing = REQUIRED_WEB_KEYS.filter((key) => !getPublicEnv(key).trim());
  console.error("Firebase web missing critical keys:", missing);
}

export function isFirebaseWebConfigured(): boolean {
  return firebaseWebConfig !== null;
}

export function getMissingFirebaseWebEnvNames(): string[] {
  if (firebaseWebConfig) {
    return [];
  }
  return REQUIRED_WEB_KEYS.filter((key) => !getPublicEnv(key).trim());
}

let browserApp: FirebaseApp | null = null;
let browserAuth: Auth | null = null;
let browserDb: Firestore | null = null;

export function getFirebaseApp(): FirebaseApp | null {
  if (typeof window === "undefined" || !firebaseWebConfig) {
    return null;
  }
  if (!browserApp) {
    browserApp = getApps().length === 0 ? initializeApp(firebaseWebConfig) : getApp();
  }
  return browserApp;
}

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

// Backward compatibility for imports that expect these names.
export const app = getFirebaseApp();
export const auth = getFirebaseAuth();
export const db = getFirebaseDb();
export { getFirebaseAuth as firebaseAuth };
