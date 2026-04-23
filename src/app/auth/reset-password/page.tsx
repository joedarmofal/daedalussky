import type { ReactElement } from "react";
import Link from "next/link";

export default function ResetPasswordPage(): ReactElement {
  return (
    <main className="mx-auto flex min-h-full max-w-md flex-col gap-6 px-6 py-16 text-foreground">
      <div>
        <p className="font-mono text-xs uppercase tracking-widest text-muted">Auth</p>
        <h1 className="mt-2 text-2xl font-semibold">Password reset</h1>
        <p className="mt-2 text-sm text-muted">
          Supabase-based password recovery was removed. Use Firebase Authentication (console or
          client flows you enable there) to reset passwords for your users.
        </p>
      </div>
      <p className="text-sm">
        <Link href="/login" className="text-accent underline-offset-2 hover:underline">
          Go to sign in
        </Link>
      </p>
    </main>
  );
}
