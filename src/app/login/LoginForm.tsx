"use client";

import type { FormEvent, ReactElement } from "react";
import { useState } from "react";
import Link from "next/link";

import { createClient } from "@/utils/supabase/client";

function mapAuthError(message: string): string {
  const normalized = message.toLowerCase();

  if (normalized.includes("invalid login credentials")) {
    return "Invalid email or password. Confirm the user exists in Supabase Auth and has a password set.";
  }

  if (normalized.includes("email not confirmed")) {
    return "Email is not confirmed yet. Confirm it in Supabase Auth, or disable confirmation for testing.";
  }

  if (normalized.includes("api key") || normalized.includes("invalid jwt")) {
    return "Supabase key configuration issue. Use NEXT_PUBLIC_SUPABASE_ANON_KEY (preferred) or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY and restart dev server.";
  }

  return message;
}

export function LoginForm(): ReactElement {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [magicPending, setMagicPending] = useState(false);
  const [resetPending, setResetPending] = useState(false);

  function buildRedirect(path: string): string {
    if (typeof window === "undefined") {
      return path;
    }
    return `${window.location.origin}${path}`;
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setPending(true);
    try {
      const supabase = createClient();
      const normalizedEmail = email.trim().toLowerCase();
      const { error: signError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });
      if (signError) {
        setError(mapAuthError(signError.message));
        return;
      }
      window.location.href = "/";
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to sign in. Check Supabase configuration.";
      setError(message);
    } finally {
      setPending(false);
    }
  }

  async function sendMagicLink(): Promise<void> {
    setError(null);
    setNotice(null);
    setMagicPending(true);
    try {
      const normalizedEmail = email.trim().toLowerCase();
      if (!normalizedEmail) {
        setError("Enter your email first, then choose Magic Link.");
        return;
      }
      const supabase = createClient();
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: normalizedEmail,
        options: {
          emailRedirectTo: buildRedirect("/auth/callback?next=/"),
        },
      });
      if (otpError) {
        setError(mapAuthError(otpError.message));
        return;
      }
      setNotice("Magic link sent. Check your email and open the link on this device.");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to send magic link.";
      setError(message);
    } finally {
      setMagicPending(false);
    }
  }

  async function sendResetEmail(): Promise<void> {
    setError(null);
    setNotice(null);
    setResetPending(true);
    try {
      const normalizedEmail = email.trim().toLowerCase();
      if (!normalizedEmail) {
        setError("Enter your email first, then choose Reset Password.");
        return;
      }
      const supabase = createClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        normalizedEmail,
        {
          redirectTo: buildRedirect("/auth/reset-password"),
        },
      );
      if (resetError) {
        setError(mapAuthError(resetError.message));
        return;
      }
      setNotice(
        "Password reset email sent. Use the link, then set a new password.",
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to send reset email.";
      setError(message);
    } finally {
      setResetPending(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-full max-w-md flex-col gap-8 px-6 py-16">
      <div>
        <p className="hmi-hero-chrome font-mono text-accent">Access</p>
        <h1 className="mt-2 text-2xl font-semibold text-foreground">Sign in</h1>
        <p className="mt-2 text-sm text-muted">
          Use your Supabase Auth user. After sign-in, the home route opens{" "}
          <span className="font-mono text-parchment">Mission Control</span>.
        </p>
      </div>
      <form
        onSubmit={(e) => void onSubmit(e)}
        className="space-y-4 rounded-xl border border-border bg-surface p-6 shadow-[inset_0_1px_0_0_var(--grid-strong)]"
      >
        <label className="block space-y-1.5">
          <span className="text-xs font-medium uppercase tracking-wide text-muted">
            Email
          </span>
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-sm text-foreground outline-none ring-accent/40 focus:ring-2"
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs font-medium uppercase tracking-wide text-muted">
            Password
          </span>
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-sm text-foreground outline-none ring-accent/40 focus:ring-2"
          />
        </label>
        {error ? (
          <p className="rounded border border-danger/40 bg-danger/5 px-3 py-2 font-mono text-xs text-danger">
            {error}
          </p>
        ) : null}
        {notice ? (
          <p className="rounded border border-accent/40 bg-accent/10 px-3 py-2 font-mono text-xs text-accent">
            {notice}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-md border border-accent/50 bg-accent/15 py-2.5 font-mono text-sm font-medium text-accent hover:bg-accent/25 disabled:opacity-50"
        >
          {pending ? "Signing in…" : "Sign in"}
        </button>
        <div className="grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            disabled={magicPending}
            onClick={() => void sendMagicLink()}
            className="rounded-md border border-border py-2.5 font-mono text-sm text-foreground hover:border-accent/40 disabled:opacity-50"
          >
            {magicPending ? "Sending…" : "Send Magic Link"}
          </button>
          <button
            type="button"
            disabled={resetPending}
            onClick={() => void sendResetEmail()}
            className="rounded-md border border-border py-2.5 font-mono text-sm text-foreground hover:border-accent/40 disabled:opacity-50"
          >
            {resetPending ? "Sending…" : "Reset Password"}
          </button>
        </div>
      </form>
      <p className="text-center text-sm text-muted">
        <Link href="/" className="text-accent underline-offset-2 hover:underline">
          ← Back to home
        </Link>
      </p>
    </main>
  );
}
