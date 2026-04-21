"use client";

import type { FormEvent, ReactElement } from "react";
import { useMemo, useState } from "react";
import Link from "next/link";

import { createClient } from "@/utils/supabase/client";

export default function ResetPasswordPage(): ReactElement {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const canSubmit = useMemo(
    () => password.length >= 8 && confirmPassword.length >= 8,
    [password, confirmPassword],
  );

  async function onSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setError(null);
    setNotice(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setPending(true);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        setError(updateError.message);
        return;
      }

      setNotice("Password updated. You can now sign in to Mission Control.");
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to update password. Try opening the reset link again.";
      setError(message);
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-full max-w-md flex-col gap-8 px-6 py-16">
      <div>
        <p className="hmi-hero-chrome font-mono text-accent">Auth Recovery</p>
        <h1 className="mt-2 text-2xl font-semibold text-foreground">
          Set a new password
        </h1>
        <p className="mt-2 text-sm text-muted">
          Open this page from the reset email link, then choose a new password.
        </p>
      </div>

      <form
        onSubmit={(e) => void onSubmit(e)}
        className="space-y-4 rounded-xl border border-border bg-surface p-6 shadow-[inset_0_1px_0_0_var(--grid-strong)]"
      >
        <label className="block space-y-1.5">
          <span className="text-xs font-medium uppercase tracking-wide text-muted">
            New password
          </span>
          <input
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-sm text-foreground outline-none ring-accent/40 focus:ring-2"
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs font-medium uppercase tracking-wide text-muted">
            Confirm password
          </span>
          <input
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
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
          disabled={pending || !canSubmit}
          className="w-full rounded-md border border-accent/50 bg-accent/15 py-2.5 font-mono text-sm font-medium text-accent hover:bg-accent/25 disabled:opacity-50"
        >
          {pending ? "Updating…" : "Update password"}
        </button>
      </form>

      <p className="text-center text-sm text-muted">
        <Link href="/login" className="text-accent underline-offset-2 hover:underline">
          ← Back to sign in
        </Link>
      </p>
    </main>
  );
}
