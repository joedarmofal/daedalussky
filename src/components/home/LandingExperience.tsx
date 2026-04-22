import type { ReactElement } from "react";
import Image from "next/image";
import Link from "next/link";

export function LandingExperience(): ReactElement {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <section className="relative border-b border-border bg-surface/80 backdrop-blur-sm">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:items-center lg:gap-12 lg:py-20">
          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center gap-3">
              <span className="hmi-hero-chrome font-mono">HMI · v0</span>
              <span
                className="hidden h-4 w-px bg-[var(--parchment-dim)] sm:block"
                aria-hidden
              />
              <span className="hmi-hero-chrome font-mono text-accent">
                ORG · TENANT
              </span>
            </div>
            <h1 className="text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-[2.35rem] lg:leading-tight">
              Human body, machine wing — one operational surface
            </h1>
            <p className="max-w-xl text-pretty text-lg leading-relaxed text-muted">
              Daedalus Sky treats crew, aircraft, and clinical context as a
              single human–machine interface: telemetry you can trust, weight
              and certification state you can read at a glance, and FHIR-backed
              debriefs when the mission demands it.
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                href="/mission-control"
                className="rounded-md border border-accent/50 bg-accent/10 px-4 py-2 font-mono text-sm font-medium text-accent hover:bg-accent/20"
              >
                Open Mission Control
              </Link>
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href="/members"
                  className="rounded-md border border-border bg-background/60 px-3 py-1.5 font-mono text-xs text-foreground hover:border-accent/40"
                >
                  Members
                </Link>
                <Link
                  href="/debriefing"
                  className="rounded-md border border-border bg-background/60 px-3 py-1.5 font-mono text-xs text-foreground hover:border-accent/40"
                >
                  Debriefing
                </Link>
                <Link
                  href="/schedule"
                  className="rounded-md border border-border bg-background/60 px-3 py-1.5 font-mono text-xs text-foreground hover:border-accent/40"
                >
                  Schedule
                </Link>
                <Link
                  href="/quality"
                  className="rounded-md border border-border bg-background/60 px-3 py-1.5 font-mono text-xs text-foreground hover:border-accent/40"
                >
                  Quality
                </Link>
                <Link
                  href="/education"
                  className="rounded-md border border-border bg-background/60 px-3 py-1.5 font-mono text-xs text-foreground hover:border-accent/40"
                >
                  Education
                </Link>
                <Link
                  href="/clients"
                  className="rounded-md border border-border bg-background/60 px-3 py-1.5 font-mono text-xs text-foreground hover:border-accent/40"
                >
                  Clients
                </Link>
                <Link
                  href="/pulse-check"
                  className="rounded-md border border-border bg-background/60 px-3 py-1.5 font-mono text-xs text-foreground hover:border-accent/40"
                >
                  Pulse Check
                </Link>
              </div>
              <div className="flex flex-wrap gap-2 font-mono text-sm">
                <span className="rounded border border-border bg-background/60 px-3 py-1.5 text-parchment">
                  mass · kg
                </span>
                <span className="rounded border border-border bg-background/60 px-3 py-1.5 text-parchment">
                  certs · TTL
                </span>
                <span className="rounded border border-border bg-background/60 px-3 py-1.5 text-parchment">
                  FHIR · sync
                </span>
              </div>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-xl lg:max-w-none">
            <p className="hmi-hero-chrome mb-3 font-mono text-[0.6rem] text-[var(--parchment-dim)]">
              FIG. I — ANATOMY / ACTUATION (DAEDALUS CODEX)
            </p>
            <div className="hmi-hero-panel overflow-hidden p-2 sm:p-3">
              <div className="relative overflow-hidden rounded-sm bg-[#0a0d14]">
                <Image
                  src="/hero-daedalus.png"
                  alt="Renaissance study of human back musculature merged with an articulated mechanical wing, representing the human–machine interface."
                  width={1024}
                  height={534}
                  priority
                  className="hmi-hero-art"
                  sizes="(min-width: 1024px) 42vw, 100vw"
                />
                <div className="hmi-hero-scanlines" aria-hidden />
                <div
                  className="pointer-events-none absolute inset-0 rounded-sm shadow-[inset_0_0_100px_rgba(7,11,18,0.85)]"
                  aria-hidden
                />
              </div>
            </div>
            <p className="mt-4 max-w-md font-mono text-xs leading-relaxed text-muted">
              Instrument readout framing: the organic load path meets the
              engineered lift path — the same question we ask in dispatch and
              debrief.
            </p>
          </div>
        </div>
      </section>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-12">
        <section className="rounded-xl border border-border bg-surface p-6 shadow-[inset_0_1px_0_0_var(--grid-strong)]">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
            Status
          </h2>
          <p className="mt-2 text-foreground">
            API route:{" "}
            <Link
              className="font-medium text-accent underline-offset-4 hover:underline"
              href="/api/health"
            >
              /api/health
            </Link>
          </p>
        </section>
      </main>
    </div>
  );
}
