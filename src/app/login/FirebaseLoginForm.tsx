"use client";

import Link from "next/link";
import type { FormEvent, ReactElement } from "react";
import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";

import { getFirebaseAuth } from "@firebase-config";


function getFirebaseAuthErrorMessage(err: unknown): string {
  const code =
    err &&
    typeof err === "object" &&
    "code" in err &&
    typeof (err as { code: unknown }).code === "string"
      ? (err as { code: string }).code
      : null;
  const rawMessage =
    err &&
    typeof err === "object" &&
    "message" in err &&
    typeof (err as { message: unknown }).message === "string"
      ? (err as { message: string }).message
      : "";

  if (process.env.NODE_ENV === "development" && code) {
    // Full code + message helps distinguish config vs credential issues (IAM rarely affects this flow).
    console.error("[Firebase Auth]", code, rawMessage);
  }

  switch (code) {
    case "auth/operation-not-allowed":
      return "Email/password is turned off for this Firebase project. In Firebase Console → Build → Authentication → Sign-in method, enable Email/Password (and create a user under Users if needed).";
    case "auth/invalid-api-key":
      return "Web API key does not match this Firebase app. Copy the Web app config from Project settings and fix NEXT_PUBLIC_FIREBASE_* (or NEXT_PUBLIC_FIREBASE_CONFIG).";
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Invalid email or password.";
    case "auth/too-many-requests":
      return "Too many attempts. Try again later.";
    case "auth/network-request-failed":
      return "Network error talking to Firebase. Check connectivity, VPN, and ad blockers.";
    case "auth/unauthorized-domain":
      return "This site’s domain is not allowed for Firebase Auth. Add it under Authentication → Settings → Authorized domains (e.g. localhost, your Hosting / App Hosting domain).";
    case "auth/invalid-email":
      return "That email address is not valid.";
    case "auth/user-disabled":
      return "This account has been disabled.";
    default:
      break;
  }

  const normalized = rawMessage.toLowerCase();
  if (normalized.includes("invalid-credential") || normalized.includes("wrong-password")) {
    return "Invalid email or password.";
  }
  if (normalized.includes("user-not-found")) {
    return "No account found for this email.";
  }
  if (normalized.includes("too-many-requests")) {
    return "Too many attempts. Try again later.";
  }
  return rawMessage || "Sign-in failed.";
}

export function FirebaseLoginForm(): ReactElement {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const auth = getFirebaseAuth();
      await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
      window.location.href = "/mission-control";
    } catch (err: unknown) {
      setError(getFirebaseAuthErrorMessage(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="flex min-h-full flex-1 flex-col bg-[#070b12] text-zinc-100">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-8 px-6 py-16">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-cyan-400/90">
            Daedalus Sky
          </p>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-50">Sign in</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Firebase email and password. After sign-in you&apos;ll go to Mission Control.
          </p>
        </div>

        <form
          onSubmit={(ev) => void onSubmit(ev)}
          className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-950/80 p-6 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] backdrop-blur-sm"
        >
          <label className="block space-y-1.5">
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Email
            </span>
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(ev) => setEmail(ev.target.value)}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900/90 px-3 py-2.5 font-mono text-sm text-zinc-100 outline-none ring-cyan-500/30 placeholder:text-zinc-600 focus:border-cyan-500/50 focus:ring-2"
              placeholder="you@organization.com"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Password
            </span>
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(ev) => setPassword(ev.target.value)}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900/90 px-3 py-2.5 font-mono text-sm text-zinc-100 outline-none ring-cyan-500/30 placeholder:text-zinc-600 focus:border-cyan-500/50 focus:ring-2"
              placeholder="••••••••"
            />
          </label>

          {error ? (
            <p
              className="rounded-lg border border-red-500/35 bg-red-950/40 px-3 py-2 font-mono text-xs text-red-200"
              role="alert"
            >
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg border border-cyan-500/40 bg-cyan-500/15 py-2.5 font-mono text-sm font-medium text-cyan-300 transition hover:bg-cyan-500/25 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="text-center text-sm text-zinc-500">
          <Link href="/" className="text-cyan-400/90 underline-offset-4 hover:underline">
            ← Back to home
          </Link>
        </p>
      </div>
    </main>
  );
}
