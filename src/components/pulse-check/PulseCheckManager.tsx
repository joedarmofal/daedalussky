"use client";

import { useEffect, useMemo, useState } from "react";

import { OrgPrimaryNav } from "@/components/org/OrgPrimaryNav";
import { authedFetch } from "@/lib/authed-fetch";

type PulseCheckLink = {
  id: string;
  tripNumber: string;
  token: string;
  status: string;
  createdAt: string;
  responseCount: number;
  surveyPath: string;
  surveyUrl: string;
  qrUrl: string;
};

type PulseCheckResponse = {
  trips: string[];
  links: PulseCheckLink[];
};

export function PulseCheckManager() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tripNumber, setTripNumber] = useState("");
  const [customTripNumber, setCustomTripNumber] = useState("");
  const [links, setLinks] = useState<PulseCheckLink[]>([]);
  const [trips, setTrips] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    const res = await authedFetch("/api/pulse-check", { cache: "no-store" });
    const body = (await res.json()) as PulseCheckResponse | { error?: string };
    if (!res.ok || !("links" in body) || !("trips" in body)) {
      const apiError = "error" in body ? body.error : undefined;
      setError(apiError ?? "Unable to load pulse check data.");
      setLoading(false);
      return;
    }
    setLinks(body.links);
    setTrips(body.trips);
    setLoading(false);
  }

  useEffect(() => {
    queueMicrotask(() => {
      void load();
    });
  }, []);

  const selectedTrip = useMemo(() => {
    if (tripNumber === "__custom__") {
      return customTripNumber.trim();
    }
    return tripNumber.trim();
  }, [customTripNumber, tripNumber]);

  async function createLink(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setNotice(null);

    const res = await authedFetch("/api/pulse-check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tripNumber: selectedTrip }),
    });
    const body = (await res.json()) as { error?: string; link?: PulseCheckLink };
    if (!res.ok || !body.link) {
      setError(body.error ?? "Could not create pulse check link.");
      setSaving(false);
      return;
    }

    setNotice(`Created survey link for trip ${body.link.tripNumber}.`);
    await load();
    setSaving(false);
  }

  async function copyLink(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setNotice("Survey URL copied to clipboard.");
    } catch {
      setError("Clipboard permission blocked. Copy the URL manually.");
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.2em] text-accent">Customer service intelligence</p>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Pulse Check</h1>
        <p className="max-w-3xl text-sm text-muted">
          Generate a unique QR code for a trip number and share it with people who can sign in to Daedalus
          Sky—survey pages and submissions require an authenticated session.
        </p>
        <OrgPrimaryNav currentPath="/pulse-check" />
      </header>

      <section className="rounded border border-border bg-surface/70 p-4">
        <h2 className="text-sm font-semibold text-foreground">Create trip survey link</h2>
        <form className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end" onSubmit={createLink}>
          <div className="space-y-2">
            <label className="block text-xs uppercase tracking-[0.14em] text-muted" htmlFor="trip-number">
              Trip number
            </label>
            <select
              id="trip-number"
              className="w-full rounded border border-border bg-background px-3 py-2 text-sm text-foreground"
              value={tripNumber}
              onChange={(event) => setTripNumber(event.target.value)}
            >
              <option value="">Select from debriefs</option>
              {trips.map((trip) => (
                <option key={trip} value={trip}>
                  {trip}
                </option>
              ))}
              <option value="__custom__">Custom trip number</option>
            </select>
            {tripNumber === "__custom__" ? (
              <input
                className="w-full rounded border border-border bg-background px-3 py-2 text-sm text-foreground"
                value={customTripNumber}
                onChange={(event) => setCustomTripNumber(event.target.value)}
                placeholder="Enter trip number"
              />
            ) : null}
          </div>
          <button
            type="submit"
            disabled={saving || !selectedTrip}
            className="rounded border border-accent/50 bg-accent/15 px-4 py-2 text-sm font-medium text-accent disabled:opacity-50"
          >
            {saving ? "Creating..." : "Create QR Link"}
          </button>
        </form>
        {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}
        {notice ? <p className="mt-3 text-sm text-accent">{notice}</p> : null}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Active pulse checks</h2>
        {loading ? <p className="text-sm text-muted">Loading links...</p> : null}
        {!loading && links.length === 0 ? (
          <p className="rounded border border-border bg-surface/60 p-4 text-sm text-muted">
            No pulse check links yet. Create your first trip QR code above.
          </p>
        ) : null}
        <div className="grid gap-3 md:grid-cols-2">
          {links.map((link) => (
            <article key={link.id} className="rounded border border-border bg-surface/70 p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-muted">Trip</p>
              <p className="text-lg font-semibold text-foreground">{link.tripNumber}</p>
              <p className="mt-1 text-xs text-muted">
                Responses: {link.responseCount} | Created: {new Date(link.createdAt).toLocaleString()}
              </p>
              <div className="mt-3 flex gap-4">
                {/* third-party endpoint only renders a QR image from the survey URL */}
                <img src={link.qrUrl} alt={`QR code for trip ${link.tripNumber}`} className="h-28 w-28 rounded border border-border bg-white p-1" />
                <div className="min-w-0 flex-1 space-y-2">
                  <p className="truncate text-xs text-muted">{link.surveyUrl}</p>
                  <button
                    type="button"
                    onClick={() => copyLink(link.surveyUrl)}
                    className="rounded border border-border px-3 py-1.5 text-xs text-foreground hover:border-accent/50 hover:text-accent"
                  >
                    Copy survey link
                  </button>
                  <a
                    href={link.surveyPath}
                    className="block text-xs text-accent underline-offset-2 hover:underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open survey page
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
