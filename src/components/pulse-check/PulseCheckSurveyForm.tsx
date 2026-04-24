"use client";

import { useEffect, useState } from "react";

import { authedFetch } from "@/lib/authed-fetch";

type SurveyLink = {
  id: string;
  tripNumber: string;
  status: string;
};

export function PulseCheckSurveyForm(props: { token: string }) {
  const [link, setLink] = useState<SurveyLink | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const [overallRating, setOverallRating] = useState(5);
  const [communicationRating, setCommunicationRating] = useState(5);
  const [professionalismRating, setProfessionalismRating] = useState(5);
  const [wouldRecommend, setWouldRecommend] = useState<"yes" | "no">("yes");
  const [comments, setComments] = useState("");
  const [respondentEmail, setRespondentEmail] = useState("");

  useEffect(() => {
    async function load() {
      const res = await authedFetch(`/api/pulse-check/public/${props.token}`, { cache: "no-store" });
      const body = (await res.json()) as { link?: SurveyLink; error?: string };
      if (!res.ok || !body.link) {
        setError(body.error ?? "Survey link not available.");
        setLoading(false);
        return;
      }
      setLink(body.link);
      setLoading(false);
    }
    void load();
  }, [props.token]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    const res = await authedFetch(`/api/pulse-check/public/${props.token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        overallRating,
        communicationRating,
        professionalismRating,
        wouldRecommend,
        comments,
        respondentEmail,
      }),
    });
    const body = (await res.json()) as { error?: string };
    if (!res.ok) {
      setError(body.error ?? "Could not submit survey.");
      setSaving(false);
      return;
    }
    setSubmitted(true);
    setSaving(false);
  }

  if (loading) {
    return <main className="mx-auto max-w-xl px-4 py-10 text-sm text-muted">Loading survey...</main>;
  }
  if (error && !link) {
    return <main className="mx-auto max-w-xl px-4 py-10 text-sm text-red-400">{error}</main>;
  }
  if (submitted) {
    return (
      <main className="mx-auto max-w-xl px-4 py-10">
        <div className="rounded border border-border bg-surface/70 p-6">
          <h1 className="text-xl font-semibold text-foreground">Thank you.</h1>
          <p className="mt-2 text-sm text-muted">
            Your feedback for trip {link?.tripNumber} has been submitted.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-xl px-4 py-10">
      <div className="rounded border border-border bg-surface/70 p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-accent">Daedalus Sky</p>
        <h1 className="mt-2 text-xl font-semibold text-foreground">Pulse Check Survey</h1>
        <p className="mt-1 text-sm text-muted">Trip Number: {link?.tripNumber}</p>

        <form className="mt-5 space-y-4" onSubmit={submit}>
          <label className="block text-sm text-foreground">
            Overall service rating (1-5)
            <input
              type="number"
              min={1}
              max={5}
              value={overallRating}
              onChange={(event) => setOverallRating(Number(event.target.value))}
              className="mt-1 w-full rounded border border-border bg-background px-3 py-2"
            />
          </label>
          <label className="block text-sm text-foreground">
            Communication rating (1-5)
            <input
              type="number"
              min={1}
              max={5}
              value={communicationRating}
              onChange={(event) => setCommunicationRating(Number(event.target.value))}
              className="mt-1 w-full rounded border border-border bg-background px-3 py-2"
            />
          </label>
          <label className="block text-sm text-foreground">
            Professionalism rating (1-5)
            <input
              type="number"
              min={1}
              max={5}
              value={professionalismRating}
              onChange={(event) => setProfessionalismRating(Number(event.target.value))}
              className="mt-1 w-full rounded border border-border bg-background px-3 py-2"
            />
          </label>
          <label className="block text-sm text-foreground">
            Would you recommend our service?
            <select
              value={wouldRecommend}
              onChange={(event) => setWouldRecommend(event.target.value as "yes" | "no")}
              className="mt-1 w-full rounded border border-border bg-background px-3 py-2"
            >
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </label>
          <label className="block text-sm text-foreground">
            Additional comments
            <textarea
              rows={4}
              value={comments}
              onChange={(event) => setComments(event.target.value)}
              className="mt-1 w-full rounded border border-border bg-background px-3 py-2"
              maxLength={2000}
            />
          </label>
          <label className="block text-sm text-foreground">
            Email (optional)
            <input
              type="email"
              value={respondentEmail}
              onChange={(event) => setRespondentEmail(event.target.value)}
              className="mt-1 w-full rounded border border-border bg-background px-3 py-2"
              maxLength={320}
            />
          </label>
          {error ? <p className="text-sm text-red-400">{error}</p> : null}
          <button
            type="submit"
            disabled={saving}
            className="rounded border border-accent/50 bg-accent/15 px-4 py-2 text-sm font-medium text-accent disabled:opacity-50"
          >
            {saving ? "Submitting..." : "Submit feedback"}
          </button>
        </form>
      </div>
    </main>
  );
}
