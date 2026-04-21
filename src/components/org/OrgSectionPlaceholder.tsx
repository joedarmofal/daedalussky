import type { ReactElement } from "react";

import { OrgPrimaryNav } from "./OrgPrimaryNav";

export function OrgSectionPlaceholder(props: {
  currentPath: string;
  title: string;
  subtitle: string;
  comingSoon: string[];
}): ReactElement {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-10">
      <header>
        <p className="hmi-hero-chrome font-mono text-accent">Daedalus Sky</p>
        <h1 className="mt-2 text-2xl font-semibold text-foreground">
          {props.title}
        </h1>
        <p className="mt-1 text-sm text-muted">{props.subtitle}</p>
        <OrgPrimaryNav currentPath={props.currentPath} />
      </header>

      <section className="rounded-xl border border-border bg-surface p-6 shadow-[inset_0_1px_0_0_var(--grid-strong)]">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted">
          Planned modules
        </h2>
        <ul className="mt-4 space-y-2">
          {props.comingSoon.map((item) => (
            <li
              key={item}
              className="rounded border border-border/70 bg-background/40 px-3 py-2 font-mono text-xs text-foreground"
            >
              {item}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
