"use client";

import type { ReactElement } from "react";
import { useEffect, useMemo, useState } from "react";

import { OrgPrimaryNav } from "@/components/org/OrgPrimaryNav";
import { authedFetch } from "@/lib/authed-fetch";
import {
  getMissingRequiredQuestions,
  getVisibleQuestions,
} from "@/lib/debriefing/evaluator";
import type { DebriefAnswerMap, DebriefModule } from "@/lib/debriefing/types";

type MemberOption = {
  id: string;
  displayName: string;
};

type MembersPayload = {
  members: Array<{ id: string; displayName: string }>;
};
type DebriefEntry = {
  id: string;
  module: DebriefModule;
  tripNumber: string;
  entryDate: string;
  crewMemberIds: string[];
  answers: DebriefAnswerMap;
  concernEscalated: string;
  concernSummary: string | null;
  taggedMemberId: string | null;
  taggedMemberEmail: string | null;
  notificationStatus: string;
  status: string;
};
type DebriefPayload = {
  entries: DebriefEntry[];
};
type SaveResponse = { entry?: DebriefEntry; error?: string };

const MODULES: DebriefModule[] = [
  "Clinical",
  "Aviation",
  "Communication Center",
];
const CREW_SLOT_KEYS = ["crew1", "crew2", "crew3", "crew4"] as const;

type DebriefDraft = {
  tripNumber: string;
  date: string;
  crew1: string;
  crew2: string;
  crew3: string;
  crew4: string;
  concernEscalated: boolean;
  concernSummary: string;
  taggedMemberId: string;
  answers: DebriefAnswerMap;
};

function emptyDraft(): DebriefDraft {
  return {
    tripNumber: "",
    date: "",
    crew1: "",
    crew2: "",
    crew3: "",
    crew4: "",
    concernEscalated: false,
    concernSummary: "",
    taggedMemberId: "",
    answers: {},
  };
}

export function DebriefingModules(): ReactElement {
  const [members, setMembers] = useState<MemberOption[]>([]);
  const [entries, setEntries] = useState<DebriefEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<DebriefModule, DebriefDraft>>({
    Clinical: emptyDraft(),
    Aviation: emptyDraft(),
    "Communication Center": emptyDraft(),
  });

  const sortedMembers = useMemo(
    () => [...members].sort((a, b) => a.displayName.localeCompare(b.displayName)),
    [members],
  );

  useEffect(() => {
    queueMicrotask(() => {
      void (async () => {
        try {
          const res = await authedFetch("/api/members");
          if (res.status === 401) {
            setError("Debrief member data requires authentication right now.");
            return;
          }
          const body = (await res.json()) as MembersPayload | { error?: string };
          if (!res.ok || !("members" in body)) {
            throw new Error(
              "error" in body && body.error
                ? body.error
                : "Failed to load members for crew selection.",
            );
          }
          setMembers(body.members);
          const debriefRes = await authedFetch("/api/debriefing");
          const debriefBody = (await debriefRes.json()) as
            | DebriefPayload
            | { error?: string };
          if (!debriefRes.ok || !("entries" in debriefBody)) {
            throw new Error(
              "error" in debriefBody && debriefBody.error
                ? debriefBody.error
                : "Failed to load debrief entries.",
            );
          }
          setEntries(debriefBody.entries);
        } catch (err) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load members for crew selection.",
          );
        }
      })();
    });
  }, []);

  function updateDraft(
    moduleName: DebriefModule,
    key: keyof DebriefDraft,
    value: string,
  ): void {
    setDrafts((prev) => ({
      ...prev,
      [moduleName]: {
        ...prev[moduleName],
        [key]: value,
      },
    }));
  }

  function updateAnswer(
    moduleName: DebriefModule,
    questionId: string,
    value: string,
  ): void {
    setDrafts((prev) => ({
      ...prev,
      [moduleName]: {
        ...prev[moduleName],
        answers: {
          ...prev[moduleName].answers,
          [questionId]: value,
        },
      },
    }));
  }

  function validateModule(moduleName: DebriefModule): string[] {
    const draft = drafts[moduleName];
    const requiredTop: string[] = [];
    if (!draft.tripNumber.trim()) {
      requiredTop.push("Trip Number");
    }
    if (!draft.date.trim()) {
      requiredTop.push("Date");
    }
    if (draft.concernEscalated && !draft.concernSummary.trim()) {
      requiredTop.push("Concern Summary");
    }
    if (draft.concernEscalated && !draft.taggedMemberId) {
      requiredTop.push("Tagged Member");
    }
    const visibleQuestions = getVisibleQuestions(moduleName, draft.answers);
    const requiredQuestions = getMissingRequiredQuestions(
      visibleQuestions,
      draft.answers,
    );
    return [...requiredTop, ...requiredQuestions];
  }

  async function saveDraft(moduleName: DebriefModule): Promise<void> {
    setError(null);
    setNotice(null);
    const missing = validateModule(moduleName);
    if (missing.length > 0) {
      setError(
        `Missing required fields for ${moduleName}: ${missing.join(", ")}`,
      );
      return;
    }
    const draft = drafts[moduleName];
    const crewMemberIds = CREW_SLOT_KEYS.map((k) => draft[k]).filter(Boolean);
    const response = await authedFetch("/api/debriefing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        module: moduleName,
        tripNumber: draft.tripNumber,
        entryDate: draft.date,
        crewMemberIds,
        answers: draft.answers,
        status: "draft",
        concernEscalated: draft.concernEscalated,
        concernSummary: draft.concernSummary,
        taggedMemberId: draft.taggedMemberId,
      }),
    });
    const body = (await response.json()) as SaveResponse;
    if (!response.ok || !body.entry) {
      setError(
        typeof body.error === "string"
          ? body.error
          : `Failed to save ${moduleName} draft.`,
      );
      return;
    }
    setEntries((prev) => [body.entry as DebriefEntry, ...prev]);
    setNotice(`${moduleName} draft saved.`);
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-10">
      <header>
        <p className="hmi-hero-chrome font-mono text-accent">Daedalus Sky</p>
        <h1 className="mt-2 text-2xl font-semibold text-foreground">Debriefing</h1>
        <p className="mt-1 text-sm text-muted">
          Rules scaffold enabled for Clinical, Aviation, and Communication Center.
        </p>
        <OrgPrimaryNav currentPath="/debriefing" />
      </header>

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

      <section className="rounded-xl border border-border bg-surface p-6 shadow-[inset_0_1px_0_0_var(--grid-strong)]">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted">
          Debrief modules
        </h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          {MODULES.map((moduleName) => {
            const draft = drafts[moduleName];
            const questions = getVisibleQuestions(moduleName, draft.answers);
            return (
              <article
                key={moduleName}
                className="rounded-lg border border-border/70 bg-background/40 p-4"
              >
                <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground">
                  {moduleName}
                </h3>
                <div className="mt-3 space-y-2">
                  <input
                    type="text"
                    placeholder="Trip Number"
                    value={draft.tripNumber}
                    onChange={(e) =>
                      updateDraft(moduleName, "tripNumber", e.target.value)
                    }
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none ring-accent/40 focus:ring-2"
                  />
                  <input
                    type="date"
                    value={draft.date}
                    onChange={(e) => updateDraft(moduleName, "date", e.target.value)}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none ring-accent/40 focus:ring-2"
                  />

                  {CREW_SLOT_KEYS.map((slotKey, idx) => (
                    <select
                      key={`${moduleName}-${slotKey}`}
                      value={draft[slotKey]}
                      onChange={(e) => updateDraft(moduleName, slotKey, e.target.value)}
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none ring-accent/40 focus:ring-2"
                    >
                      <option value="">Crew Name {idx + 1}</option>
                      {sortedMembers.map((m) => (
                        <option key={`${moduleName}-${slotKey}-${m.id}`} value={m.id}>
                          {m.displayName}
                        </option>
                      ))}
                    </select>
                  ))}

                  <label className="flex items-center gap-2 rounded-md border border-border/70 bg-background px-2 py-2 text-xs text-foreground">
                    <input
                      type="checkbox"
                      checked={draft.concernEscalated}
                      onChange={(e) =>
                        setDrafts((prev) => ({
                          ...prev,
                          [moduleName]: {
                            ...prev[moduleName],
                            concernEscalated: e.target.checked,
                            concernSummary: e.target.checked
                              ? prev[moduleName].concernSummary
                              : "",
                            taggedMemberId: e.target.checked
                              ? prev[moduleName].taggedMemberId
                              : "",
                          },
                        }))
                      }
                    />
                    Escalate concern and tag member for review
                  </label>
                  {draft.concernEscalated ? (
                    <div className="space-y-2 rounded-md border border-border/70 bg-background/40 p-2">
                      <textarea
                        value={draft.concernSummary}
                        onChange={(e) =>
                          setDrafts((prev) => ({
                            ...prev,
                            [moduleName]: {
                              ...prev[moduleName],
                              concernSummary: e.target.value,
                            },
                          }))
                        }
                        rows={3}
                        placeholder="Describe the concern requiring follow-up..."
                        className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs text-foreground"
                      />
                      <select
                        value={draft.taggedMemberId}
                        onChange={(e) =>
                          setDrafts((prev) => ({
                            ...prev,
                            [moduleName]: {
                              ...prev[moduleName],
                              taggedMemberId: e.target.value,
                            },
                          }))
                        }
                        className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs text-foreground"
                      >
                        <option value="">Tag member for review</option>
                        {sortedMembers.map((m) => (
                          <option key={`${moduleName}-tag-${m.id}`} value={m.id}>
                            {m.displayName}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : null}

                  <div className="border-t border-border/60 pt-3">
                    <p className="font-mono text-[0.65rem] uppercase tracking-wide text-muted">
                      Standards-mapped prompts
                    </p>
                    <div className="mt-2 space-y-3">
                      {questions.map((q) => {
                        const value = draft.answers[q.id] ?? "";
                        return (
                          <div key={`${moduleName}-${q.id}`} className="space-y-1">
                            <label className="block text-xs text-foreground">
                              {q.prompt}
                              <span className="ml-1 font-mono text-[0.65rem] text-parchment-dim">
                                ({q.standardRef})
                              </span>
                            </label>
                            {q.type === "yes_no" ? (
                              <select
                                value={value}
                                onChange={(e) =>
                                  updateAnswer(moduleName, q.id, e.target.value)
                                }
                                className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs text-foreground"
                              >
                                <option value="">Select</option>
                                <option value="Yes">Yes</option>
                                <option value="No">No</option>
                              </select>
                            ) : null}
                            {q.type === "select" ? (
                              <select
                                value={value}
                                onChange={(e) =>
                                  updateAnswer(moduleName, q.id, e.target.value)
                                }
                                className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs text-foreground"
                              >
                                <option value="">Select</option>
                                {(q.options ?? []).map((opt) => (
                                  <option key={`${q.id}-${opt}`} value={opt}>
                                    {opt}
                                  </option>
                                ))}
                              </select>
                            ) : null}
                            {q.type === "text" ? (
                              <input
                                type="text"
                                value={value}
                                onChange={(e) =>
                                  updateAnswer(moduleName, q.id, e.target.value)
                                }
                                className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs text-foreground"
                              />
                            ) : null}
                            {q.type === "number" ? (
                              <input
                                type="number"
                                value={value}
                                onChange={(e) =>
                                  updateAnswer(moduleName, q.id, e.target.value)
                                }
                                className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs text-foreground"
                              />
                            ) : null}
                            {q.type === "textarea" ? (
                              <textarea
                                value={value}
                                onChange={(e) =>
                                  updateAnswer(moduleName, q.id, e.target.value)
                                }
                                rows={3}
                                className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs text-foreground"
                              />
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      void saveDraft(moduleName);
                    }}
                    className="w-full rounded-md border border-accent/50 bg-accent/15 px-3 py-2 font-mono text-xs font-medium text-accent hover:bg-accent/25"
                  >
                    Save {moduleName} Draft
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>
      <section className="rounded-xl border border-border bg-surface p-6 shadow-[inset_0_1px_0_0_var(--grid-strong)]">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted">
          Saved debrief drafts
        </h2>
        <div className="mt-4 space-y-2">
          {entries.map((entry) => (
            <article
              key={entry.id}
              className="rounded border border-border/70 bg-background/40 px-3 py-2"
            >
              <p className="font-mono text-[0.65rem] text-parchment-dim">
                {entry.module} · Trip {entry.tripNumber} · {entry.entryDate} · {entry.status}
              </p>
              {entry.concernEscalated === "true" ? (
                <p className="mt-1 text-xs text-foreground">
                  Escalated to {entry.taggedMemberEmail ?? "unknown"} · Notification:{" "}
                  {entry.notificationStatus}
                </p>
              ) : null}
            </article>
          ))}
          {entries.length === 0 ? (
            <p className="text-xs text-muted">No saved debrief drafts yet.</p>
          ) : null}
        </div>
      </section>
    </main>
  );
}
