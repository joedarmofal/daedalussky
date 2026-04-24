/** HttpOnly cookie used with Firebase Admin `createSessionCookie` / Edge `jose` verification. */
export const FIREBASE_SESSION_COOKIE_NAME = "__session";

/** Session cookie TTL (Firebase allows 5 minutes … 14 days). */
export const SESSION_COOKIE_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 5;
