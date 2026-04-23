import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

export type FirebaseWebConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
};

function loadWebConfigFromEnv(): FirebaseWebConfig {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  const messagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
  const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;

  if (
    apiKey &&
    authDomain &&
    projectId &&
    storageBucket &&
    messagingSenderId &&
    appId
  ) {
    return {
      apiKey,
      authDomain,
      projectId,
      storageBucket,
      messagingSenderId,
      appId,
    };
  }

  const bundled = process.env.NEXT_PUBLIC_FIREBASE_CONFIG?.trim();
  if (bundled) {
    try {
      return JSON.parse(bundled) as FirebaseWebConfig;
    } catch {
      throw new Error("NEXT_PUBLIC_FIREBASE_CONFIG must be valid JSON.");
    }
  }

  throw new Error(
    "Missing Firebase web config. Set NEXT_PUBLIC_FIREBASE_API_KEY, NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN, NEXT_PUBLIC_FIREBASE_PROJECT_ID, NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET, NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID, NEXT_PUBLIC_FIREBASE_APP_ID (or NEXT_PUBLIC_FIREBASE_CONFIG as JSON).",
  );
}

let browserApp: FirebaseApp | null = null;

/** Firebase web app (browser only). */
export function getFirebaseApp(): FirebaseApp {
  if (typeof window === "undefined") {
    throw new Error("Firebase web SDK must only be used in the browser.");
  }
  if (!browserApp) {
    browserApp =
      getApps().length > 0 ? getApps()[0]! : initializeApp(loadWebConfigFromEnv());
  }
  return browserApp;
}

let browserAuth: Auth | null = null;
let browserDb: Firestore | null = null;

/** Shared Firebase Auth instance (browser only). */
export function getFirebaseAuth(): Auth {
  if (!browserAuth) {
    browserAuth = getAuth(getFirebaseApp());
  }
  return browserAuth;
}

/** Shared Cloud Firestore instance (browser only). */
export function getFirebaseDb(): Firestore {
  if (!browserDb) {
    browserDb = getFirestore(getFirebaseApp());
  }
  return browserDb;
}

/**
 * Lazily initialized client: use `firebase.auth` / `firebase.db` in client code
 * (e.g. event handlers), not during SSR.
 */
export const firebase = {
  get auth(): Auth {
    return getFirebaseAuth();
  },
  get db(): Firestore {
    return getFirebaseDb();
  },
};

/** Same as `getFirebaseAuth` / `firebase.auth`. */
export { getFirebaseAuth as auth, getFirebaseDb as db };

/** Stable alias for code that expects this name. */
export const firebaseAuth = getFirebaseAuth;
