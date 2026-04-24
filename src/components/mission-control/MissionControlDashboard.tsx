"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactElement } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { signOut } from "firebase/auth";

import { authedFetch } from "@/lib/authed-fetch";
import { getFirebaseAuth } from "@firebase-config";
import { faaTfrListUrl } from "@/lib/mission-control/tfr-feed";
import { wmoWeatherLabel } from "@/lib/mission-control/wmo-weather";
import type {
  MissionControlTfrPayload,
  MissionControlWeather,
} from "@/types/mission-control";
import { OrgPrimaryNav } from "@/components/org/OrgPrimaryNav";

type MissionHazard = {
  id: string;
  title: string;
  details: string | null;
  status: "current" | "resolved";
  createdAt: string;
  resolvedAt: string | null;
};

type MissionBulletin = {
  id: string;
  note: string;
  isImportant: boolean;
  createdByDisplayName: string | null;
  createdAt: string;
};

const RadarMap = dynamic(
  () => import("./RadarMap").then((m) => m.RadarMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[380px] items-center justify-center rounded-sm border border-border bg-surface-elevated font-mono text-sm text-muted sm:min-h-[440px]">
        Loading radar…
      </div>
    ),
  },
);

const DEFAULT_LAT = Number(
  process.env.NEXT_PUBLIC_DEFAULT_WEATHER_LAT ?? "39.5",
);
const DEFAULT_LON = Number(
  process.env.NEXT_PUBLIC_DEFAULT_WEATHER_LON ?? "-98.35",
);

const BASE_SCHEDULES: {
  callSign: string;
  base: string;
  crew: { role: string; name: string }[];
}[] = [
  {
    callSign: "Med Evac 1",
    base: "Primary Operations Base",
    crew: [
      { role: "Flight RN", name: "Nicole Cook" },
      { role: "Flight Paramedic", name: "John Cock" },
      { role: "Pilot", name: "Ed Lock" },
      { role: "Mechanic", name: "Gary Murry" },
    ],
  },
];

function formatTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZoneName: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function MissionControlDashboard(): ReactElement {
  const pathname = usePathname();
  const [now, setNow] = useState<string>(() => new Date().toISOString());
  const [position, setPosition] = useState<{ lat: number; lon: number } | null>(
    null,
  );
  const [geoState, setGeoState] = useState<
    "pending" | "granted" | "denied" | "unsupported"
  >("pending");
  const [weather, setWeather] = useState<MissionControlWeather | null>(null);
  const [tfr, setTfr] = useState<MissionControlTfrPayload | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [hazards, setHazards] = useState<MissionHazard[]>([]);
  const [archiveHazards, setArchiveHazards] = useState<MissionHazard[]>([]);
  const [hazardTitle, setHazardTitle] = useState("");
  const [hazardDetails, setHazardDetails] = useState("");
  const [hazardNotice, setHazardNotice] = useState<string | null>(null);
  const [hazardError, setHazardError] = useState<string | null>(null);
  const [loadingHazards, setLoadingHazards] = useState(false);
  const [savingHazard, setSavingHazard] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const [bulletins, setBulletins] = useState<MissionBulletin[]>([]);
  const [bulletinText, setBulletinText] = useState("");
  const [bulletinImportant, setBulletinImportant] = useState(false);
  const [bulletinRange, setBulletinRange] = useState<"all" | "24h">("all");
  const [bulletinError, setBulletinError] = useState<string | null>(null);
  const [bulletinNotice, setBulletinNotice] = useState<string | null>(null);
  const [loadingBulletins, setLoadingBulletins] = useState(false);
  const [savingBulletin, setSavingBulletin] = useState(false);

  const coords = useMemo(
    () => position ?? { lat: DEFAULT_LAT, lon: DEFAULT_LON },
    [position],
  );

  const refresh = useCallback(async () => {
    setLoadError(null);
    const { lat, lon } = coords;
    try {
      const [wRes, tRes] = await Promise.all([
        authedFetch(`/api/mission-control/weather?lat=${lat}&lon=${lon}`),
        authedFetch(`/api/mission-control/tfr?lat=${lat}&lon=${lon}`),
      ]);
      if (wRes.status === 401 || tRes.status === 401) {
        setLoadError("Weather/TFR feeds require authentication right now.");
        return;
      }
      if (!wRes.ok) {
        throw new Error("weather");
      }
      if (!tRes.ok) {
        throw new Error("tfr");
      }
      setWeather((await wRes.json()) as MissionControlWeather);
      setTfr((await tRes.json()) as MissionControlTfrPayload);
    } catch {
      setLoadError("Mission Control could not refresh weather or TFR data.");
    }
  }, [coords]);

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date().toISOString()), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) {
      queueMicrotask(() => setGeoState("unsupported"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => {
        queueMicrotask(() => {
          setPosition({
            lat: p.coords.latitude,
            lon: p.coords.longitude,
          });
          setGeoState("granted");
        });
      },
      () => {
        queueMicrotask(() => setGeoState("denied"));
      },
      { enableHighAccuracy: false, maximumAge: 600_000, timeout: 12_000 },
    );
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void refresh();
    });
  }, [refresh]);

  const refreshHazards = useCallback(async (): Promise<void> => {
    setLoadingHazards(true);
    setHazardError(null);
    try {
      const [currentRes, archiveRes] = await Promise.all([
        authedFetch("/api/mission-control/hazards?view=current", { cache: "no-store" }),
        authedFetch("/api/mission-control/hazards?view=archive", { cache: "no-store" }),
      ]);
      if (currentRes.status === 401 || archiveRes.status === 401) {
        setHazardError("Hazards require authentication right now.");
        return;
      }
      const currentBody = (await currentRes.json()) as {
        hazards?: MissionHazard[];
        error?: string;
      };
      const archiveBody = (await archiveRes.json()) as {
        hazards?: MissionHazard[];
        error?: string;
      };
      if (!currentRes.ok || !archiveRes.ok || !currentBody.hazards || !archiveBody.hazards) {
        setHazardError(
          currentBody.error ??
            archiveBody.error ??
            "Unable to load hazard list.",
        );
        return;
      }
      setHazards(currentBody.hazards);
      setArchiveHazards(archiveBody.hazards);
    } catch {
      setHazardError("Unable to load hazard list.");
    } finally {
      setLoadingHazards(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void refreshHazards();
    });
  }, [refreshHazards]);

  async function submitHazard(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setSavingHazard(true);
    setHazardError(null);
    setHazardNotice(null);

    const response = await authedFetch("/api/mission-control/hazards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: hazardTitle, details: hazardDetails }),
    });
    const body = (await response.json()) as { error?: string };
    if (!response.ok) {
      setHazardError(body.error ?? "Unable to add hazard.");
      setSavingHazard(false);
      return;
    }

    setHazardTitle("");
    setHazardDetails("");
    setHazardNotice("Hazard added to current list.");
    await refreshHazards();
    setSavingHazard(false);
  }

  async function updateHazardStatus(
    hazardId: string,
    status: "current" | "resolved",
  ): Promise<void> {
    setHazardError(null);
    setHazardNotice(null);
    const response = await authedFetch(`/api/mission-control/hazards/${hazardId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const body = (await response.json()) as { error?: string };
    if (!response.ok) {
      setHazardError(body.error ?? "Unable to update hazard.");
      return;
    }
    setHazardNotice(
      status === "resolved"
        ? "Hazard marked resolved and moved to archive."
        : "Hazard restored to current list.",
    );
    await refreshHazards();
  }

  const refreshBulletins = useCallback(async (): Promise<void> => {
    setLoadingBulletins(true);
    setBulletinError(null);
    try {
      const url =
        bulletinRange === "24h"
          ? "/api/mission-control/bulletins?range=24h"
          : "/api/mission-control/bulletins";
      const responseFiltered = await authedFetch(url, {
        cache: "no-store",
      });
      if (responseFiltered.status === 401) {
        setBulletinError("Bulletin board requires authentication right now.");
        return;
      }
      const body = (await responseFiltered.json()) as {
        bulletins?: MissionBulletin[];
        error?: string;
      };
      if (!responseFiltered.ok || !body.bulletins) {
        setBulletinError(body.error ?? "Unable to load bulletin board.");
        return;
      }
      setBulletins(body.bulletins);
    } catch {
      setBulletinError("Unable to load bulletin board.");
    } finally {
      setLoadingBulletins(false);
    }
  }, [bulletinRange]);

  useEffect(() => {
    queueMicrotask(() => {
      void refreshBulletins();
    });
  }, [refreshBulletins]);

  async function submitBulletin(
    event: React.FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();
    setSavingBulletin(true);
    setBulletinError(null);
    setBulletinNotice(null);

    const response = await authedFetch("/api/mission-control/bulletins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note: bulletinText, isImportant: bulletinImportant }),
    });
    const body = (await response.json()) as { error?: string };
    if (!response.ok) {
      setBulletinError(body.error ?? "Unable to save note.");
      setSavingBulletin(false);
      return;
    }

    setBulletinText("");
    setBulletinImportant(false);
    setBulletinNotice("Operational note posted.");
    await refreshBulletins();
    setSavingBulletin(false);
  }

  async function onSignOut(): Promise<void> {
    try {
      await fetch("/api/auth/session", { method: "DELETE", credentials: "include" });
    } catch {
      // Still sign out client-side so the UI cannot stay "logged in" without Firebase.
    }
    await signOut(getFirebaseAuth());
    window.location.href = "/";
  }

  const tfrCount = tfr?.items.length ?? 0;

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="border-b border-border bg-surface/90 px-6 py-4 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="hmi-hero-chrome font-mono text-accent">
              Daedalus Sky
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Mission Control
            </h1>
            <p className="mt-1 font-mono text-xs text-muted">
              Regional weather · radar · TFR awareness · KPI snapshot
            </p>
            <OrgPrimaryNav currentPath={pathname ?? "/mission-control"} />
          </div>
          <div className="flex flex-wrap items-center gap-3 font-mono text-sm">
            <span className="rounded border border-border px-3 py-1.5 text-parchment">
              UTC / local — {formatTime(now)}
            </span>
            <span className="rounded border border-border px-3 py-1.5 text-muted">
              FIX{" "}
              <span className="text-foreground">
                {coords.lat.toFixed(3)}°, {coords.lon.toFixed(3)}°
              </span>
              {geoState === "pending" ? " · locating" : null}
              {geoState === "denied" ? " · geo denied" : null}
              {geoState === "unsupported" ? " · geo n/a" : null}
            </span>
            <button
              type="button"
              onClick={() => void refresh()}
              className="rounded border border-accent/40 px-3 py-1.5 text-accent hover:bg-accent/10"
            >
              Refresh
            </button>
            <button
              type="button"
              onClick={() => void onSignOut()}
              className="rounded border border-border px-3 py-1.5 text-muted hover:border-danger/50 hover:text-danger"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-8">
        {loadError ? (
          <p
            className="rounded border border-danger/40 bg-danger/5 px-4 py-3 font-mono text-sm text-danger"
            role="alert"
          >
            {loadError}
          </p>
        ) : null}

        <section className="rounded-xl border border-border bg-surface p-5 shadow-[inset_0_1px_0_0_var(--grid-strong)]">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted">
              Base schedules
            </h2>
            <p className="font-mono text-[0.65rem] text-parchment-dim">
              Live roster board (demo data)
            </p>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {BASE_SCHEDULES.map((schedule) => (
              <article
                key={schedule.callSign}
                className="rounded-lg border border-border/80 bg-background/40 p-4"
              >
                <p className="font-mono text-[0.65rem] uppercase tracking-widest text-parchment-dim">
                  {schedule.base}
                </p>
                <h3 className="mt-1 text-lg font-semibold text-foreground">
                  {schedule.callSign}
                </h3>
                <ul className="mt-3 space-y-2">
                  {schedule.crew.map((member) => (
                    <li
                      key={`${schedule.callSign}-${member.role}`}
                      className="flex items-center justify-between gap-4 border-b border-border/40 pb-1.5 text-sm"
                    >
                      <span className="font-mono text-muted">{member.role}</span>
                      <span className="text-foreground">{member.name}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            label="Flight hours (MTD)"
            value="128.4"
            unit="h"
            hint="Wire to ops telemetry"
          />
          <KpiCard
            label="Dispatch SLA"
            value="97.2"
            unit="%"
            hint="On-time release window"
          />
          <KpiCard
            label="Certs ≤ 30d"
            value="6"
            unit="crew"
            hint="From member_certifications"
          />
          <KpiCard
            label="TFR rows (feed)"
            value={String(tfrCount)}
            unit="active"
            hint={tfr?.source ?? "—"}
          />
        </section>

        <section className="rounded-xl border border-border bg-surface p-5 shadow-[inset_0_1px_0_0_var(--grid-strong)]">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted">
              Hazards list
            </h2>
            <button
              type="button"
              onClick={() => setShowArchive((prev) => !prev)}
              className="rounded border border-border px-3 py-1.5 font-mono text-xs text-muted hover:border-accent/40 hover:text-accent"
            >
              {showArchive ? "Hide archive" : "Show archive"}
            </button>
          </div>

          <form className="mt-4 grid gap-3" onSubmit={(event) => void submitHazard(event)}>
            <input
              value={hazardTitle}
              onChange={(event) => setHazardTitle(event.target.value)}
              placeholder="Hazard title (required)"
              className="rounded border border-border bg-background/40 px-3 py-2 text-sm text-foreground"
              maxLength={140}
              required
            />
            <textarea
              value={hazardDetails}
              onChange={(event) => setHazardDetails(event.target.value)}
              placeholder="Details, location, or mitigation notes"
              className="min-h-20 rounded border border-border bg-background/40 px-3 py-2 text-sm text-foreground"
              maxLength={4000}
            />
            <div>
              <button
                type="submit"
                disabled={savingHazard}
                className="rounded border border-accent/40 px-3 py-1.5 text-sm text-accent hover:bg-accent/10 disabled:opacity-60"
              >
                {savingHazard ? "Adding..." : "Add hazard"}
              </button>
            </div>
          </form>

          {hazardError ? (
            <p className="mt-3 rounded border border-danger/40 bg-danger/5 px-3 py-2 text-sm text-danger">
              {hazardError}
            </p>
          ) : null}
          {hazardNotice ? (
            <p className="mt-3 rounded border border-accent/30 bg-accent/10 px-3 py-2 text-sm text-accent">
              {hazardNotice}
            </p>
          ) : null}

          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            <div className="rounded-lg border border-border/80 bg-background/40 p-4">
              <h3 className="font-mono text-[0.65rem] uppercase tracking-widest text-parchment-dim">
                Current hazards
              </h3>
              {loadingHazards ? (
                <p className="mt-3 text-sm text-muted">Loading hazards...</p>
              ) : null}
              {!loadingHazards && hazards.length === 0 ? (
                <p className="mt-3 text-sm text-muted">No current hazards logged.</p>
              ) : null}
              <ul className="mt-3 space-y-2">
                {hazards.map((hazard) => (
                  <li
                    key={hazard.id}
                    className="rounded border border-border/60 bg-surface-elevated/40 p-3"
                  >
                    <p className="text-sm font-semibold text-foreground">{hazard.title}</p>
                    {hazard.details ? (
                      <p className="mt-1 text-sm text-muted">{hazard.details}</p>
                    ) : null}
                    <p className="mt-2 font-mono text-[0.65rem] text-parchment-dim">
                      Logged {new Date(hazard.createdAt).toLocaleString()}
                    </p>
                    <button
                      type="button"
                      onClick={() => void updateHazardStatus(hazard.id, "resolved")}
                      className="mt-2 rounded border border-border px-2.5 py-1 text-xs text-muted hover:border-accent/40 hover:text-accent"
                    >
                      Mark resolved
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {showArchive ? (
              <div className="rounded-lg border border-border/80 bg-background/40 p-4">
                <h3 className="font-mono text-[0.65rem] uppercase tracking-widest text-parchment-dim">
                  Hazard archive
                </h3>
                {loadingHazards ? (
                  <p className="mt-3 text-sm text-muted">Loading archive...</p>
                ) : null}
                {!loadingHazards && archiveHazards.length === 0 ? (
                  <p className="mt-3 text-sm text-muted">No archived hazards yet.</p>
                ) : null}
                <ul className="mt-3 space-y-2">
                  {archiveHazards.map((hazard) => (
                    <li
                      key={hazard.id}
                      className="rounded border border-border/60 bg-surface-elevated/40 p-3"
                    >
                      <p className="text-sm font-semibold text-foreground">{hazard.title}</p>
                      {hazard.details ? (
                        <p className="mt-1 text-sm text-muted">{hazard.details}</p>
                      ) : null}
                      <p className="mt-2 font-mono text-[0.65rem] text-parchment-dim">
                        Resolved {hazard.resolvedAt ? new Date(hazard.resolvedAt).toLocaleString() : "—"}
                      </p>
                      <button
                        type="button"
                        onClick={() => void updateHazardStatus(hazard.id, "current")}
                        className="mt-2 rounded border border-border px-2.5 py-1 text-xs text-muted hover:border-accent/40 hover:text-accent"
                      >
                        Restore to current
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-border/70 bg-background/20 p-4">
                <p className="text-sm text-muted">
                  Resolved hazards are removed from current view and retained in archive.
                </p>
              </div>
            )}
          </div>
        </section>

        <section className="rounded-xl border border-border bg-surface p-5 shadow-[inset_0_1px_0_0_var(--grid-strong)]">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted">
            Bulletin board
          </h2>
          <p className="mt-1 text-sm text-muted">
            Members can post free-text operational notes with automatic date/time stamps.
          </p>
          <form className="mt-4 grid gap-3" onSubmit={(event) => void submitBulletin(event)}>
            <textarea
              value={bulletinText}
              onChange={(event) => setBulletinText(event.target.value)}
              placeholder="Add operational note..."
              className="min-h-24 rounded border border-border bg-background/40 px-3 py-2 text-sm text-foreground"
              maxLength={4000}
              required
            />
            <div>
              <label className="mb-2 flex items-center gap-2 text-xs text-muted">
                <input
                  type="checkbox"
                  checked={bulletinImportant}
                  onChange={(event) => setBulletinImportant(event.target.checked)}
                  className="h-4 w-4 rounded border-border bg-background/40"
                />
                Pin as important
              </label>
              <button
                type="submit"
                disabled={savingBulletin}
                className="rounded border border-accent/40 px-3 py-1.5 text-sm text-accent hover:bg-accent/10 disabled:opacity-60"
              >
                {savingBulletin ? "Posting..." : "Post note"}
              </button>
            </div>
          </form>
          {bulletinError ? (
            <p className="mt-3 rounded border border-danger/40 bg-danger/5 px-3 py-2 text-sm text-danger">
              {bulletinError}
            </p>
          ) : null}
          {bulletinNotice ? (
            <p className="mt-3 rounded border border-accent/30 bg-accent/10 px-3 py-2 text-sm text-accent">
              {bulletinNotice}
            </p>
          ) : null}
          <div className="mt-4 rounded-lg border border-border/80 bg-background/40 p-4">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <h3 className="font-mono text-[0.65rem] uppercase tracking-widest text-parchment-dim">
                Recent entries
              </h3>
              <label className="font-mono text-[0.65rem] text-muted">
                Filter
                <select
                  value={bulletinRange}
                  onChange={(event) =>
                    setBulletinRange(event.target.value === "24h" ? "24h" : "all")
                  }
                  className="ml-2 rounded border border-border bg-background/40 px-2 py-1 text-xs text-foreground"
                >
                  <option value="all">All</option>
                  <option value="24h">Last 24h</option>
                </select>
              </label>
            </div>
            {loadingBulletins ? (
              <p className="mt-3 text-sm text-muted">Loading notes...</p>
            ) : null}
            {!loadingBulletins && bulletins.length === 0 ? (
              <p className="mt-3 text-sm text-muted">No notes posted yet.</p>
            ) : null}
            <ul className="mt-3 space-y-2">
              {bulletins.map((entry) => (
                <li
                  key={entry.id}
                  className="rounded border border-border/60 bg-surface-elevated/40 p-3"
                >
                  {entry.isImportant ? (
                    <p className="mb-1 font-mono text-[0.65rem] uppercase tracking-widest text-accent">
                      Important
                    </p>
                  ) : null}
                  <p className="whitespace-pre-wrap text-sm text-foreground">{entry.note}</p>
                  <p className="mt-2 font-mono text-[0.65rem] text-parchment-dim">
                    {new Date(entry.createdAt).toLocaleString()}
                    {" · "}
                    {entry.createdByDisplayName ?? "Unknown member"}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          <div className="flex flex-col gap-6">
            <section className="rounded-xl border border-border bg-surface p-5 shadow-[inset_0_1px_0_0_var(--grid-strong)]">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-muted">
                Regional weather
              </h2>
              {weather ? (
                <div className="mt-4 space-y-4">
                  <div>
                    <p className="font-mono text-4xl font-semibold tabular-nums text-foreground">
                      {Math.round(weather.current.temperatureF)}°F
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      {wmoWeatherLabel(weather.current.weatherCode)} · RH{" "}
                      {weather.current.relativeHumidity}% · wind{" "}
                      {Math.round(weather.current.windMph)} mph @{" "}
                      {Math.round(weather.current.windDirectionDeg)}°
                    </p>
                    <p className="mt-2 font-mono text-xs text-parchment-dim">
                      TZ {weather.timezone} · obs {weather.current.time}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">
                      Daily outlook
                    </h3>
                    <ul className="mt-2 space-y-2 font-mono text-xs text-muted">
                      {weather.daily.slice(0, 5).map((d) => (
                        <li
                          key={d.date}
                          className="flex justify-between border-b border-border/60 py-1.5 text-foreground/90"
                        >
                          <span>{d.date}</span>
                          <span className="tabular-nums">
                            {Math.round(d.tempMinF)}–{Math.round(d.tempMaxF)}°F
                          </span>
                          <span className="text-muted">
                            WMO {d.weatherCode}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <p className="mt-4 font-mono text-sm text-muted">
                  Awaiting weather…
                </p>
              )}
              <p className="mt-4 text-[0.65rem] leading-relaxed text-muted">
                Weather data by{" "}
                <a
                  className="text-accent underline-offset-2 hover:underline"
                  href="https://open-meteo.com/"
                  target="_blank"
                  rel="noreferrer"
                >
                  Open-Meteo
                </a>
                .
              </p>
            </section>

            <section className="rounded-xl border border-border bg-surface p-5 shadow-[inset_0_1px_0_0_var(--grid-strong)]">
              <div className="flex flex-wrap items-end justify-between gap-2">
                <h2 className="text-xs font-semibold uppercase tracking-widest text-muted">
                  TFR awareness
                </h2>
                <Link
                  href={faaTfrListUrl()}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-xs text-accent underline-offset-2 hover:underline"
                >
                  FAA graphic TFR list ↗
                </Link>
              </div>
              {tfr?.disclaimer ? (
                <p className="mt-2 text-xs leading-relaxed text-muted">
                  {tfr.disclaimer}
                </p>
              ) : null}
              <ul className="mt-4 max-h-64 space-y-3 overflow-y-auto pr-1 font-mono text-xs">
                {tfr && tfr.items.length > 0 ? (
                  tfr.items.map((item) => (
                    <li
                      key={item.id}
                      className="rounded border border-border/80 bg-background/40 px-3 py-2"
                    >
                      <p className="text-[0.65rem] uppercase tracking-wide text-parchment-dim">
                        {item.authority} · {item.id}
                      </p>
                      <p className="mt-1 text-sm text-foreground">{item.summary}</p>
                      {(item.validFrom ?? item.validTo) ? (
                        <p className="mt-1 text-[0.65rem] text-muted">
                          {item.validFrom ?? "?"} → {item.validTo ?? "?"}
                        </p>
                      ) : null}
                    </li>
                  ))
                ) : (
                  <li className="text-muted">
                    No TFR rows in the current aggregate for this region. Use the
                    FAA link above for authoritative NOTAM / TFR data before
                    flight.
                  </li>
                )}
              </ul>
              <p className="mt-3 text-[0.65rem] text-muted">
                Source: {tfr?.source ?? "—"} · fetched {tfr?.fetchedAt ?? "—"}
              </p>
            </section>
          </div>

          <section className="flex flex-col gap-3">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted">
              Precipitation radar
            </h2>
            <RadarMap lat={coords.lat} lon={coords.lon} />
            <p className="font-mono text-[0.65rem] leading-relaxed text-muted">
              Basemap © OpenStreetMap / CARTO. Radar mosaic © RainViewer. Does
              not replace official briefing products.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

function KpiCard(props: {
  label: string;
  value: string;
  unit: string;
  hint: string;
}): ReactElement {
  return (
    <article className="rounded-xl border border-border bg-surface-elevated/60 p-4 shadow-[inset_0_1px_0_0_var(--grid-strong)]">
      <p className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted">
        {props.label}
      </p>
      <p className="mt-2 font-mono text-3xl font-semibold tabular-nums text-foreground">
        {props.value}
        <span className="ml-1 text-lg font-normal text-parchment-dim">
          {props.unit}
        </span>
      </p>
      <p className="mt-2 font-mono text-[0.65rem] text-muted">{props.hint}</p>
    </article>
  );
}
