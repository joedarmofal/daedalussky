"use client";

import { useCallback, useEffect, useState, type FormEvent, type ReactElement } from "react";

import { OrgPrimaryNav } from "@/components/org/OrgPrimaryNav";
import { useOrg } from "@/components/org/OrgProvider";
import { authedFetch } from "@/lib/authed-fetch";

type BaseRow = {
  id: string;
  name: string;
  code: string | null;
  notes: string | null;
};

type AircraftRow = {
  id: string;
  baseId: string | null;
  tailNumber: string;
  model: string | null;
  notes: string | null;
};

export function SettingsPage(): ReactElement {
  const org = useOrg();
  const [profileMsg, setProfileMsg] = useState<string | null>(null);
  const [orgMsg, setOrgMsg] = useState<string | null>(null);
  const [bases, setBases] = useState<BaseRow[]>([]);
  const [aircraft, setAircraft] = useState<AircraftRow[]>([]);
  const [resourcesError, setResourcesError] = useState<string | null>(null);

  const [baseName, setBaseName] = useState("");
  const [baseCode, setBaseCode] = useState("");
  const [acTail, setAcTail] = useState("");
  const [acModel, setAcModel] = useState("");
  const [acBaseId, setAcBaseId] = useState("");

  const [editingBase, setEditingBase] = useState<BaseRow | null>(null);
  const [ebName, setEbName] = useState("");
  const [ebCode, setEbCode] = useState("");
  const [ebNotes, setEbNotes] = useState("");

  const [editingAc, setEditingAc] = useState<AircraftRow | null>(null);
  const [eaTail, setEaTail] = useState("");
  const [eaModel, setEaModel] = useState("");
  const [eaBaseId, setEaBaseId] = useState("");
  const [eaNotes, setEaNotes] = useState("");

  const loadResources = useCallback(async () => {
    if (!org.isOrgAdmin) {
      return;
    }
    setResourcesError(null);
    try {
      const [bRes, aRes] = await Promise.all([
        authedFetch("/api/bases", { cache: "no-store" }),
        authedFetch("/api/aircraft", { cache: "no-store" }),
      ]);
      const bJson = (await bRes.json()) as { bases?: BaseRow[]; error?: string };
      const aJson = (await aRes.json()) as { aircraft?: AircraftRow[]; error?: string };
      if (!bRes.ok) {
        setResourcesError(bJson.error ?? "Could not load bases.");
        return;
      }
      if (!aRes.ok) {
        setResourcesError(aJson.error ?? "Could not load aircraft.");
        return;
      }
      setBases(bJson.bases ?? []);
      setAircraft(aJson.aircraft ?? []);
    } catch {
      setResourcesError("Could not load bases or aircraft.");
    }
  }, [org.isOrgAdmin]);

  useEffect(() => {
    queueMicrotask(() => {
      void loadResources();
    });
  }, [loadResources]);

  function beginBaseEdit(base: BaseRow): void {
    setEditingBase(base);
    setEbName(base.name);
    setEbCode(base.code ?? "");
    setEbNotes(base.notes ?? "");
  }

  function beginAircraftEdit(ac: AircraftRow): void {
    setEditingAc(ac);
    setEaTail(ac.tailNumber);
    setEaModel(ac.model ?? "");
    setEaBaseId(ac.baseId ?? "");
    setEaNotes(ac.notes ?? "");
  }

  async function onProfileSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setProfileMsg(null);
    if (!org.member) {
      return;
    }
    const fd = new FormData(e.currentTarget);
    const payload = {
      displayName: String(fd.get("displayName") ?? "").trim(),
      position: String(fd.get("position") ?? "").trim() || null,
      mobileNumber: String(fd.get("mobileNumber") ?? "").trim() || null,
      mobileCarrier: String(fd.get("mobileCarrier") ?? "").trim() || null,
      employeeId: String(fd.get("employeeId") ?? "").trim() || null,
      emergencyContactName: String(fd.get("emergencyContactName") ?? "").trim() || null,
      emergencyContactPhone: String(fd.get("emergencyContactPhone") ?? "").trim() || null,
      emergencyContactAddress: String(fd.get("emergencyContactAddress") ?? "").trim() || null,
      flightSuitSize: String(fd.get("flightSuitSize") ?? "").trim() || null,
      tShirtSize: String(fd.get("tShirtSize") ?? "").trim() || null,
    };
    const res = await authedFetch("/api/settings/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = (await res.json()) as { error?: string };
    if (!res.ok) {
      setProfileMsg(body.error ?? "Could not save profile.");
      return;
    }
    setProfileMsg("Profile saved.");
    await org.refetch();
  }

  async function onOrgSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setOrgMsg(null);
    const fd = new FormData(e.currentTarget);
    const res = await authedFetch("/api/settings/organization", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        displayName: String(fd.get("displayName") ?? "").trim(),
        legalName: String(fd.get("legalName") ?? "").trim(),
      }),
    });
    const body = (await res.json()) as { error?: string };
    if (!res.ok) {
      setOrgMsg(body.error ?? "Could not save organization.");
      return;
    }
    setOrgMsg("Organization updated.");
    await org.refetch();
  }

  async function addBase(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setResourcesError(null);
    const res = await authedFetch("/api/bases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: baseName.trim(),
        code: baseCode.trim() || null,
      }),
    });
    const body = (await res.json()) as { error?: string };
    if (!res.ok) {
      setResourcesError(body.error ?? "Could not create base.");
      return;
    }
    setBaseName("");
    setBaseCode("");
    await loadResources();
  }

  async function deleteBase(id: string): Promise<void> {
    setResourcesError(null);
    const res = await authedFetch(`/api/bases/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const body = (await res.json()) as { error?: string };
      setResourcesError(body.error ?? "Could not delete base.");
      return;
    }
    await loadResources();
  }

  async function addAircraft(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setResourcesError(null);
    const res = await authedFetch("/api/aircraft", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tailNumber: acTail.trim(),
        model: acModel.trim() || null,
        baseId: acBaseId.trim() || null,
      }),
    });
    const body = (await res.json()) as { error?: string };
    if (!res.ok) {
      setResourcesError(body.error ?? "Could not create aircraft.");
      return;
    }
    setAcTail("");
    setAcModel("");
    setAcBaseId("");
    await loadResources();
  }

  async function deleteAircraft(id: string): Promise<void> {
    setResourcesError(null);
    const res = await authedFetch(`/api/aircraft/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const body = (await res.json()) as { error?: string };
      setResourcesError(body.error ?? "Could not delete aircraft.");
      return;
    }
    await loadResources();
  }

  async function saveBaseEdit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    if (!editingBase) {
      return;
    }
    setResourcesError(null);
    const res = await authedFetch(`/api/bases/${editingBase.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: ebName.trim(),
        code: ebCode.trim() || null,
        notes: ebNotes.trim() || null,
      }),
    });
    const body = (await res.json()) as { error?: string };
    if (!res.ok) {
      setResourcesError(body.error ?? "Could not update base.");
      return;
    }
    setEditingBase(null);
    await loadResources();
  }

  async function saveAircraftEdit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    if (!editingAc) {
      return;
    }
    setResourcesError(null);
    const res = await authedFetch(`/api/aircraft/${editingAc.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tailNumber: eaTail.trim(),
        model: eaModel.trim() || null,
        baseId: eaBaseId.trim() || null,
        notes: eaNotes.trim() || null,
      }),
    });
    const body = (await res.json()) as { error?: string };
    if (!res.ok) {
      setResourcesError(body.error ?? "Could not update aircraft.");
      return;
    }
    setEditingAc(null);
    await loadResources();
  }

  if (org.loading) {
    return (
      <main className="mx-auto flex max-w-4xl flex-1 flex-col px-4 py-10 text-sm text-muted">
        Loading settings…
      </main>
    );
  }

  if (org.error && !org.member) {
    return (
      <main className="mx-auto flex max-w-4xl flex-1 flex-col gap-4 px-4 py-10">
        <p className="text-sm text-red-400" role="alert">
          {org.error}
        </p>
      </main>
    );
  }

  if (!org.member || !org.organization) {
    return (
      <main className="mx-auto flex max-w-4xl flex-1 flex-col px-4 py-10 text-sm text-muted">
        Sign in to manage settings.
      </main>
    );
  }

  const m = org.member;
  const o = org.organization;

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6">
      <header className="space-y-2">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">Operations</p>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Settings</h1>
        <p className="max-w-2xl text-sm text-muted">
          Profile is available to all members. Organization name, bases, and aircraft are limited to
          administrators (Admin or Owner).
        </p>
        <OrgPrimaryNav currentPath="/settings" />
      </header>

      <section className="rounded border border-border bg-surface/70 p-4 sm:p-6">
        <h2 className="text-sm font-semibold text-foreground">Your profile</h2>
        <p className="mt-1 text-xs text-muted">Updates apply only to your member record in this organization.</p>
        <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={(ev) => void onProfileSubmit(ev)}>
          <label className="block text-sm sm:col-span-2">
            <span className="text-muted">Display name</span>
            <input
              name="displayName"
              required
              defaultValue={m.displayName}
              className="mt-1 w-full rounded border border-border bg-background px-3 py-2 text-foreground"
            />
          </label>
          <label className="block text-sm">
            <span className="text-muted">Position</span>
            <input
              name="position"
              defaultValue={m.position ?? ""}
              className="mt-1 w-full rounded border border-border bg-background px-3 py-2 text-foreground"
            />
          </label>
          <label className="block text-sm">
            <span className="text-muted">Employee ID</span>
            <input
              name="employeeId"
              defaultValue={m.employeeId ?? ""}
              className="mt-1 w-full rounded border border-border bg-background px-3 py-2 text-foreground"
            />
          </label>
          <label className="block text-sm">
            <span className="text-muted">Mobile</span>
            <input
              name="mobileNumber"
              defaultValue={m.mobileNumber ?? ""}
              className="mt-1 w-full rounded border border-border bg-background px-3 py-2 text-foreground"
            />
          </label>
          <label className="block text-sm">
            <span className="text-muted">Mobile carrier</span>
            <input
              name="mobileCarrier"
              defaultValue={m.mobileCarrier ?? ""}
              className="mt-1 w-full rounded border border-border bg-background px-3 py-2 text-foreground"
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="text-muted">Emergency contact name</span>
            <input
              name="emergencyContactName"
              defaultValue={m.emergencyContactName ?? ""}
              className="mt-1 w-full rounded border border-border bg-background px-3 py-2 text-foreground"
            />
          </label>
          <label className="block text-sm">
            <span className="text-muted">Emergency phone</span>
            <input
              name="emergencyContactPhone"
              defaultValue={m.emergencyContactPhone ?? ""}
              className="mt-1 w-full rounded border border-border bg-background px-3 py-2 text-foreground"
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="text-muted">Emergency address</span>
            <input
              name="emergencyContactAddress"
              defaultValue={m.emergencyContactAddress ?? ""}
              className="mt-1 w-full rounded border border-border bg-background px-3 py-2 text-foreground"
            />
          </label>
          <label className="block text-sm">
            <span className="text-muted">Flight suit size</span>
            <input
              name="flightSuitSize"
              defaultValue={m.flightSuitSize ?? ""}
              className="mt-1 w-full rounded border border-border bg-background px-3 py-2 text-foreground"
            />
          </label>
          <label className="block text-sm">
            <span className="text-muted">T-shirt size</span>
            <input
              name="tShirtSize"
              defaultValue={m.tShirtSize ?? ""}
              className="mt-1 w-full rounded border border-border bg-background px-3 py-2 text-foreground"
            />
          </label>
          <div className="flex flex-col gap-2 sm:col-span-2 sm:flex-row sm:items-center">
            <button
              type="submit"
              className="rounded border border-accent/50 bg-accent/15 px-4 py-2 text-sm font-medium text-accent hover:bg-accent/25"
            >
              Save profile
            </button>
            {profileMsg ? (
              <span className="text-sm text-muted" role="status">
                {profileMsg}
              </span>
            ) : null}
          </div>
        </form>
      </section>

      {org.isOrgAdmin ? (
        <>
          <section className="rounded border border-border bg-surface/70 p-4 sm:p-6">
            <h2 className="text-sm font-semibold text-foreground">Organization</h2>
            <p className="mt-1 text-xs text-muted">Admin · legal and display names for your tenant.</p>
            <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={(ev) => void onOrgSubmit(ev)}>
              <label className="block text-sm sm:col-span-2">
                <span className="text-muted">Display name</span>
                <input
                  name="displayName"
                  required
                  defaultValue={o.displayName}
                  className="mt-1 w-full rounded border border-border bg-background px-3 py-2 text-foreground"
                />
              </label>
              <label className="block text-sm sm:col-span-2">
                <span className="text-muted">Legal name</span>
                <input
                  name="legalName"
                  required
                  defaultValue={o.legalName}
                  className="mt-1 w-full rounded border border-border bg-background px-3 py-2 text-foreground"
                />
              </label>
              <div className="flex flex-col gap-2 sm:col-span-2 sm:flex-row sm:items-center">
                <button
                  type="submit"
                  className="rounded border border-accent/50 bg-accent/15 px-4 py-2 text-sm font-medium text-accent hover:bg-accent/25"
                >
                  Save organization
                </button>
                {orgMsg ? (
                  <span className="text-sm text-muted" role="status">
                    {orgMsg}
                  </span>
                ) : null}
              </div>
            </form>
          </section>

          <section className="rounded border border-border bg-surface/70 p-4 sm:p-6">
            <h2 className="text-sm font-semibold text-foreground">Bases</h2>
            <p className="mt-1 text-xs text-muted">Create operational bases for scheduling and aircraft.</p>
            {resourcesError ? (
              <p className="mt-2 text-sm text-red-400" role="alert">
                {resourcesError}
              </p>
            ) : null}
            <form
              className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end"
              onSubmit={(ev) => void addBase(ev)}
            >
              <label className="block min-w-[10rem] flex-1 text-sm">
                <span className="text-muted">Name</span>
                <input
                  value={baseName}
                  onChange={(e) => setBaseName(e.target.value)}
                  required
                  className="mt-1 w-full rounded border border-border bg-background px-3 py-2 text-foreground"
                />
              </label>
              <label className="block min-w-[6rem] text-sm">
                <span className="text-muted">Code</span>
                <input
                  value={baseCode}
                  onChange={(e) => setBaseCode(e.target.value)}
                  className="mt-1 w-full rounded border border-border bg-background px-3 py-2 text-foreground"
                />
              </label>
              <button
                type="submit"
                className="rounded border border-border px-4 py-2 text-sm text-foreground hover:border-accent/50"
              >
                Add base
              </button>
            </form>
            {editingBase ? (
              <form
                className="mt-4 space-y-3 rounded border border-accent/30 bg-background/40 p-4"
                onSubmit={(ev) => void saveBaseEdit(ev)}
              >
                <p className="text-xs font-medium uppercase tracking-wide text-accent">Edit base</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block text-sm sm:col-span-2">
                    <span className="text-muted">Name</span>
                    <input
                      value={ebName}
                      onChange={(e) => setEbName(e.target.value)}
                      required
                      className="mt-1 w-full rounded border border-border bg-background px-3 py-2 text-foreground"
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="text-muted">Code</span>
                    <input
                      value={ebCode}
                      onChange={(e) => setEbCode(e.target.value)}
                      className="mt-1 w-full rounded border border-border bg-background px-3 py-2 text-foreground"
                    />
                  </label>
                  <label className="block text-sm sm:col-span-2">
                    <span className="text-muted">Notes</span>
                    <textarea
                      value={ebNotes}
                      onChange={(e) => setEbNotes(e.target.value)}
                      rows={2}
                      className="mt-1 w-full rounded border border-border bg-background px-3 py-2 text-foreground"
                    />
                  </label>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="submit"
                    className="rounded border border-accent/50 bg-accent/15 px-3 py-1.5 text-xs font-medium text-accent"
                  >
                    Save changes
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingBase(null)}
                    className="rounded border border-border px-3 py-1.5 text-xs text-muted hover:text-foreground"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : null}
            <ul className="mt-4 divide-y divide-border">
              {bases.map((b) => (
                <li key={b.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium text-foreground">{b.name}</p>
                    {b.code ? <p className="text-xs text-muted">Code {b.code}</p> : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => beginBaseEdit(b)}
                      className="rounded border border-border px-3 py-1 text-xs text-foreground hover:border-accent/50"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => void deleteBase(b.id)}
                      className="rounded border border-red-500/40 px-3 py-1 text-xs text-red-300 hover:bg-red-500/10"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
              {bases.length === 0 ? <li className="py-3 text-sm text-muted">No bases yet.</li> : null}
            </ul>
          </section>

          <section className="rounded border border-border bg-surface/70 p-4 sm:p-6">
            <h2 className="text-sm font-semibold text-foreground">Aircraft</h2>
            <p className="mt-1 text-xs text-muted">Tail numbers are unique within your organization.</p>
            <form
              className="mt-4 flex flex-col gap-2 lg:flex-row lg:flex-wrap lg:items-end"
              onSubmit={(ev) => void addAircraft(ev)}
            >
              <label className="block min-w-[8rem] flex-1 text-sm">
                <span className="text-muted">Tail number</span>
                <input
                  value={acTail}
                  onChange={(e) => setAcTail(e.target.value)}
                  required
                  className="mt-1 w-full rounded border border-border bg-background px-3 py-2 font-mono text-foreground"
                />
              </label>
              <label className="block min-w-[8rem] flex-1 text-sm">
                <span className="text-muted">Model</span>
                <input
                  value={acModel}
                  onChange={(e) => setAcModel(e.target.value)}
                  className="mt-1 w-full rounded border border-border bg-background px-3 py-2 text-foreground"
                />
              </label>
              <label className="block min-w-[10rem] text-sm">
                <span className="text-muted">Home base</span>
                <select
                  value={acBaseId}
                  onChange={(e) => setAcBaseId(e.target.value)}
                  className="mt-1 w-full rounded border border-border bg-background px-3 py-2 text-foreground"
                >
                  <option value="">— None —</option>
                  {bases.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="submit"
                className="rounded border border-border px-4 py-2 text-sm text-foreground hover:border-accent/50"
              >
                Add aircraft
              </button>
            </form>
            {editingAc ? (
              <form
                className="mt-4 space-y-3 rounded border border-accent/30 bg-background/40 p-4"
                onSubmit={(ev) => void saveAircraftEdit(ev)}
              >
                <p className="text-xs font-medium uppercase tracking-wide text-accent">Edit aircraft</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block text-sm">
                    <span className="text-muted">Tail number</span>
                    <input
                      value={eaTail}
                      onChange={(e) => setEaTail(e.target.value)}
                      required
                      className="mt-1 w-full rounded border border-border bg-background px-3 py-2 font-mono text-foreground"
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="text-muted">Model</span>
                    <input
                      value={eaModel}
                      onChange={(e) => setEaModel(e.target.value)}
                      className="mt-1 w-full rounded border border-border bg-background px-3 py-2 text-foreground"
                    />
                  </label>
                  <label className="block text-sm sm:col-span-2">
                    <span className="text-muted">Home base</span>
                    <select
                      value={eaBaseId}
                      onChange={(e) => setEaBaseId(e.target.value)}
                      className="mt-1 w-full rounded border border-border bg-background px-3 py-2 text-foreground"
                    >
                      <option value="">— None —</option>
                      {bases.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-sm sm:col-span-2">
                    <span className="text-muted">Notes</span>
                    <textarea
                      value={eaNotes}
                      onChange={(e) => setEaNotes(e.target.value)}
                      rows={2}
                      className="mt-1 w-full rounded border border-border bg-background px-3 py-2 text-foreground"
                    />
                  </label>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="submit"
                    className="rounded border border-accent/50 bg-accent/15 px-3 py-1.5 text-xs font-medium text-accent"
                  >
                    Save changes
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingAc(null)}
                    className="rounded border border-border px-3 py-1.5 text-xs text-muted hover:text-foreground"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : null}
            <ul className="mt-4 divide-y divide-border">
              {aircraft.map((a) => (
                <li key={a.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-mono font-medium text-foreground">{a.tailNumber}</p>
                    <p className="text-xs text-muted">
                      {a.model ?? "Model n/a"}
                      {a.baseId ? ` · ${bases.find((b) => b.id === a.baseId)?.name ?? "Base"}` : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => beginAircraftEdit(a)}
                      className="rounded border border-border px-3 py-1 text-xs text-foreground hover:border-accent/50"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => void deleteAircraft(a.id)}
                      className="rounded border border-red-500/40 px-3 py-1 text-xs text-red-300 hover:bg-red-500/10"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
              {aircraft.length === 0 ? <li className="py-3 text-sm text-muted">No aircraft yet.</li> : null}
            </ul>
          </section>
        </>
      ) : (
        <section className="rounded border border-border bg-surface/50 p-4 sm:p-6">
          <h2 className="text-sm font-semibold text-muted">Organization administration</h2>
          <p className="mt-2 text-sm text-muted">
            Only users with the <span className="font-mono text-foreground">admin</span> or{" "}
            <span className="font-mono text-foreground">owner</span> role can change the organization name or
            manage bases and aircraft. Contact an administrator if you need changes.
          </p>
        </section>
      )}
    </main>
  );
}
