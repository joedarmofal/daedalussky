"use client";

import type { ReactElement } from "react";
import { useEffect, useMemo, useState } from "react";

import { OrgPrimaryNav } from "@/components/org/OrgPrimaryNav";

type Member = {
  id: string;
  displayName: string;
  role: string;
  status: string;
};

type Shift = {
  id: string;
  shiftDate: string;
  missionLabel: string;
  baseName: string;
  shiftStart: string | null;
  shiftEnd: string | null;
  notes: string | null;
  crewAssignments: { role: string; memberId: string }[];
  createdAt: string;
};

type ScheduleResponse = {
  requester: { role: string; displayName: string };
  members: Member[];
  shifts: Shift[];
};

const ASSIGNMENT_ROLES = [
  "Flight RN",
  "Flight Paramedic",
  "Pilot",
  "Mechanic",
] as const;

export function ScheduleBoard(): ReactElement {
  const [members, setMembers] = useState<Member[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [requesterRole, setRequesterRole] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [shiftDate, setShiftDate] = useState("");
  const [missionLabel, setMissionLabel] = useState("Med Evac 1");
  const [baseName, setBaseName] = useState("Primary Operations Base");
  const [shiftStart, setShiftStart] = useState("07:00");
  const [shiftEnd, setShiftEnd] = useState("19:00");
  const [notes, setNotes] = useState("");
  const [assignments, setAssignments] = useState<Record<string, string>>({});

  const canCreate = useMemo(
    () =>
      requesterRole === "owner" ||
      requesterRole === "admin" ||
      requesterRole === "dispatcher",
    [requesterRole],
  );

  const memberNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const m of members) {
      map.set(m.id, m.displayName);
    }
    return map;
  }, [members]);

  async function loadSchedule(): Promise<void> {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/schedule");
      if (res.status === 401) {
        setError("Schedule data requires authentication right now.");
        setLoading(false);
        return;
      }
      const body = (await res.json()) as ScheduleResponse | { error?: string };
      if (!res.ok) {
        throw new Error(
          "error" in body && body.error ? body.error : "Failed to load schedule.",
        );
      }
      if (!("members" in body) || !("shifts" in body) || !("requester" in body)) {
        throw new Error("Unexpected schedule response.");
      }
      setMembers(body.members);
      setShifts(body.shifts);
      setRequesterRole(body.requester.role);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load schedule.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    queueMicrotask(() => {
      void loadSchedule();
    });
  }, []);

  async function createShift(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const crewAssignments = Object.entries(assignments)
        .map(([role, memberId]) => ({ role, memberId }))
        .filter((a) => a.memberId);
      const res = await fetch("/api/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shiftDate,
          missionLabel,
          baseName,
          shiftStart,
          shiftEnd,
          notes,
          crewAssignments,
        }),
      });
      const body = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(body.error ?? "Failed to create shift.");
      }
      setNotice("Shift created.");
      setAssignments({});
      setNotes("");
      await loadSchedule();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create shift.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-10">
      <header>
        <p className="hmi-hero-chrome font-mono text-accent">Daedalus Sky</p>
        <h1 className="mt-2 text-2xl font-semibold text-foreground">Schedule</h1>
        <p className="mt-1 text-sm text-muted">
          Base schedule board with mission shifts and crew assignments.
        </p>
        <OrgPrimaryNav currentPath="/schedule" />
      </header>

      <section className="rounded-xl border border-border bg-surface p-5 shadow-[inset_0_1px_0_0_var(--grid-strong)]">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted">
          Create shift
        </h2>
        {!canCreate ? (
          <p className="mt-3 rounded border border-border/70 bg-background/40 px-3 py-2 font-mono text-xs text-muted">
            Only owner/admin/dispatcher can create shifts.
          </p>
        ) : null}
        <form onSubmit={(e) => void createShift(e)} className="mt-4 grid gap-3 md:grid-cols-3">
          <input
            type="date"
            value={shiftDate}
            onChange={(e) => setShiftDate(e.target.value)}
            required
            disabled={!canCreate || saving}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
          />
          <input
            type="text"
            value={missionLabel}
            onChange={(e) => setMissionLabel(e.target.value)}
            placeholder="Mission label"
            required
            disabled={!canCreate || saving}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
          />
          <input
            type="text"
            value={baseName}
            onChange={(e) => setBaseName(e.target.value)}
            placeholder="Base name"
            required
            disabled={!canCreate || saving}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
          />
          <input
            type="time"
            value={shiftStart}
            onChange={(e) => setShiftStart(e.target.value)}
            disabled={!canCreate || saving}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
          />
          <input
            type="time"
            value={shiftEnd}
            onChange={(e) => setShiftEnd(e.target.value)}
            disabled={!canCreate || saving}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
          />
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes (optional)"
            disabled={!canCreate || saving}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
          />
          {ASSIGNMENT_ROLES.map((role) => (
            <select
              key={role}
              value={assignments[role] ?? ""}
              onChange={(e) =>
                setAssignments((prev) => ({ ...prev, [role]: e.target.value }))
              }
              disabled={!canCreate || saving}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
            >
              <option value="">{role} (unassigned)</option>
              {members
                .filter((m) => m.status !== "suspended")
                .map((m) => (
                  <option key={`${role}-${m.id}`} value={m.id}>
                    {m.displayName}
                  </option>
                ))}
            </select>
          ))}
          <button
            type="submit"
            disabled={!canCreate || saving}
            className="rounded-md border border-accent/50 bg-accent/15 px-4 py-2 font-mono text-sm font-medium text-accent hover:bg-accent/25 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Create shift"}
          </button>
        </form>
        {error ? (
          <p className="mt-3 rounded border border-danger/40 bg-danger/5 px-3 py-2 font-mono text-xs text-danger">
            {error}
          </p>
        ) : null}
        {notice ? (
          <p className="mt-3 rounded border border-accent/40 bg-accent/10 px-3 py-2 font-mono text-xs text-accent">
            {notice}
          </p>
        ) : null}
      </section>

      <section className="rounded-xl border border-border bg-surface p-5 shadow-[inset_0_1px_0_0_var(--grid-strong)]">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted">
          Shift board
        </h2>
        {loading ? (
          <p className="mt-4 font-mono text-sm text-muted">Loading schedule…</p>
        ) : (
          <div className="mt-4 space-y-3">
            {shifts.map((shift) => (
              <article
                key={shift.id}
                className="rounded-lg border border-border/70 bg-background/40 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-base font-semibold text-foreground">
                    {shift.missionLabel}
                  </h3>
                  <p className="font-mono text-xs text-parchment-dim">
                    {shift.shiftDate} · {shift.baseName}
                    {shift.shiftStart || shift.shiftEnd
                      ? ` · ${shift.shiftStart ?? "--:--"}–${shift.shiftEnd ?? "--:--"}`
                      : ""}
                  </p>
                </div>
                {shift.notes ? (
                  <p className="mt-1 text-sm text-muted">{shift.notes}</p>
                ) : null}
                <ul className="mt-3 space-y-1">
                  {shift.crewAssignments.length > 0 ? (
                    shift.crewAssignments.map((a) => (
                      <li
                        key={`${shift.id}-${a.role}-${a.memberId}`}
                        className="flex justify-between border-b border-border/40 pb-1 text-sm"
                      >
                        <span className="font-mono text-muted">{a.role}</span>
                        <span className="text-foreground">
                          {memberNameById.get(a.memberId) ?? "Unknown member"}
                        </span>
                      </li>
                    ))
                  ) : (
                    <li className="text-sm text-muted">No crew assigned yet.</li>
                  )}
                </ul>
              </article>
            ))}
            {shifts.length === 0 ? (
              <p className="text-sm text-muted">No shifts created yet.</p>
            ) : null}
          </div>
        )}
      </section>
    </main>
  );
}
