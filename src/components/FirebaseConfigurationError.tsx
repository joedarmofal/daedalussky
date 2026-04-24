"use client";

import type { ReactElement } from "react";

export type FirebaseConfigurationErrorProps = {
  missingKeys: readonly string[];
  /** When Firebase Auth is unavailable but you still want to show UID from elsewhere */
  firebaseUid?: string | null;
};

export function FirebaseConfigurationError(props: FirebaseConfigurationErrorProps): ReactElement {
  async function resetSession(): Promise<void> {
    try {
      await fetch("/api/auth/session", { method: "DELETE", credentials: "include" });
    } catch {
      // still navigate home
    }
    window.location.href = "/";
  }

  return (
    <div className="flex min-h-[50vh] flex-1 flex-col items-center justify-center gap-6 px-4 py-12">
      <div className="w-full max-w-lg rounded-xl border border-amber-500/40 bg-amber-950/30 p-6 text-center shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-amber-400/90">Configuration</p>
        <h1 className="mt-3 text-xl font-semibold tracking-tight text-zinc-50">Configuration error</h1>
        <p className="mt-3 text-sm leading-relaxed text-zinc-400">
          Firebase web credentials are missing or could not be read in this environment. The app cannot
          start authentication until{" "}
          <span className="font-mono text-amber-200/90">NEXT_PUBLIC_FIREBASE_*</span> variables are set
          for this deployment.
        </p>
        {props.missingKeys.length > 0 ? (
          <ul className="mt-4 list-inside list-disc text-left text-xs font-mono text-zinc-500">
            {props.missingKeys.map((k) => (
              <li key={k}>{k}</li>
            ))}
          </ul>
        ) : null}
        {props.firebaseUid ? (
          <p className="mt-4 break-all font-mono text-xs text-zinc-500">
            Firebase UID (if known): <span className="text-zinc-300">{props.firebaseUid}</span>
          </p>
        ) : null}
        <button
          type="button"
          onClick={() => void resetSession()}
          className="mt-6 w-full rounded-lg border border-zinc-600 bg-zinc-900/80 py-2.5 font-mono text-sm text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-800"
        >
          Clear session and return to sign-in
        </button>
      </div>
    </div>
  );
}
