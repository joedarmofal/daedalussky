"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import type { ReactElement } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { createClient } from "@/utils/supabase/client";
import { faaTfrListUrl } from "@/lib/mission-control/tfr-feed";
import { wmoWeatherLabel } from "@/lib/mission-control/wmo-weather";
import type {
  MissionControlTfrPayload,
  MissionControlWeather,
} from "@/types/mission-control";
import { OrgPrimaryNav } from "@/components/org/OrgPrimaryNav";

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

  const coords = useMemo(
    () => position ?? { lat: DEFAULT_LAT, lon: DEFAULT_LON },
    [position],
  );

  const refresh = useCallback(async () => {
    setLoadError(null);
    const { lat, lon } = coords;
    try {
      const [wRes, tRes] = await Promise.all([
        fetch(`/api/mission-control/weather?lat=${lat}&lon=${lon}`),
        fetch(`/api/mission-control/tfr?lat=${lat}&lon=${lon}`),
      ]);
      if (wRes.status === 401 || tRes.status === 401) {
        window.location.href = "/login";
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

  async function signOut(): Promise<void> {
    const supabase = createClient();
    await supabase.auth.signOut();
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
            <OrgPrimaryNav currentPath="/" />
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
              onClick={() => void signOut()}
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
