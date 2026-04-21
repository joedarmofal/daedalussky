"use client";

import type { ReactElement } from "react";
import { useEffect, useMemo, useState } from "react";
import { OrgPrimaryNav } from "@/components/org/OrgPrimaryNav";

type MemberRole = "owner" | "admin" | "dispatcher" | "crew" | "medic" | "viewer";

type MemberRecord = {
  id: string;
  displayName: string;
  email: string | null;
  position: string | null;
  role: MemberRole;
  status: "invited" | "active" | "suspended";
  weightKg: string | null;
  weightLbs: string | null;
  mobileNumber: string | null;
  employeeId: string | null;
  authProvider: string | null;
  createdAt: string;
};

type MembersResponse = {
  requester: {
    role: MemberRole;
    displayName: string;
  };
  members: MemberRecord[];
};

const ROLE_OPTIONS: MemberRole[] = [
  "owner",
  "admin",
  "dispatcher",
  "crew",
  "medic",
  "viewer",
];
const POSITION_OPTIONS = [
  "Flight RN",
  "Flight RT",
  "Flight Paramedic",
  "Flight Physician",
  "Pilot",
  "Mechanic",
  "Communication Specialist",
  "Orientee",
  "Student",
  "Leader",
  "Admin",
  "Safety",
  "Aviation",
  "Educator",
] as const;
const CARRIER_OPTIONS = ["AT&T", "Verizon", "Sprint", "T-Mobile", "Other"] as const;

export function MembersManager(): ReactElement {
  const [members, setMembers] = useState<MemberRecord[]>([]);
  const [requesterRole, setRequesterRole] = useState<MemberRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<MemberRole>("crew");
  const [position, setPosition] = useState<string>("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState("");
  const [emergencyContactAddress, setEmergencyContactAddress] = useState("");
  const [weightLbs, setWeightLbs] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [hireDate, setHireDate] = useState("");
  const [yearsFlightExperience, setYearsFlightExperience] = useState("");
  const [totalYearsExperience, setTotalYearsExperience] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [mobileCarrier, setMobileCarrier] = useState("");
  const [flightSuitSize, setFlightSuitSize] = useState("");
  const [tShirtSize, setTShirtSize] = useState("");
  const [gender, setGender] = useState("");
  const [certificationType, setCertificationType] = useState("");
  const [certificationIssueDate, setCertificationIssueDate] = useState("");
  const [certificationExpirationDate, setCertificationExpirationDate] = useState("");
  const [certificationIssuingEntity, setCertificationIssuingEntity] = useState("");
  const [certificationImageFile, setCertificationImageFile] = useState<File | null>(
    null,
  );
  const [saving, setSaving] = useState(false);

  const canCreate = useMemo(
    () => requesterRole === "owner" || requesterRole === "admin",
    [requesterRole],
  );

  async function loadMembers(): Promise<void> {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/members");
      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }
      const body = (await res.json()) as MembersResponse | { error?: string };
      if (!res.ok) {
        throw new Error(
          "error" in body && body.error ? body.error : "Failed to load members.",
        );
      }
      if (!("members" in body) || !("requester" in body)) {
        throw new Error("Unexpected members response.");
      }
      setMembers(body.members);
      setRequesterRole(body.requester.role);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load members.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    queueMicrotask(() => {
      void loadMembers();
    });
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setSaving(true);
    try {
      const photoPath = photoFile
        ? await uploadImage(photoFile, "member-photo")
        : "";
      const certificationImagePath = certificationImageFile
        ? await uploadImage(certificationImageFile, "certification-image")
        : "";

      const payload = {
        displayName: displayName.trim(),
        email: email.trim().toLowerCase(),
        role,
        position,
        dateOfBirth,
        photoPath,
        emergencyContactName,
        emergencyContactPhone,
        emergencyContactAddress,
        weightLbs,
        employeeId,
        hireDate,
        yearsFlightExperience,
        totalYearsExperience,
        mobileNumber,
        mobileCarrier,
        flightSuitSize,
        tShirtSize,
        gender,
        certificationType,
        certificationIssueDate,
        certificationExpirationDate,
        certificationIssuingEntity,
        certificationImagePath,
      };
      const res = await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(body.error ?? "Failed to create member.");
      }

      setDisplayName("");
      setEmail("");
      setRole("crew");
      setPosition("");
      setDateOfBirth("");
      setPhotoFile(null);
      setEmergencyContactName("");
      setEmergencyContactPhone("");
      setEmergencyContactAddress("");
      setWeightLbs("");
      setEmployeeId("");
      setHireDate("");
      setYearsFlightExperience("");
      setTotalYearsExperience("");
      setMobileNumber("");
      setMobileCarrier("");
      setFlightSuitSize("");
      setTShirtSize("");
      setGender("");
      setCertificationType("");
      setCertificationIssueDate("");
      setCertificationExpirationDate("");
      setCertificationIssuingEntity("");
      setCertificationImageFile(null);
      setNotice("Member added as invited.");
      await loadMembers();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to create member.";
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  async function uploadImage(
    file: File,
    kind: "member-photo" | "certification-image",
  ): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("kind", kind);

    const res = await fetch("/api/storage/upload", {
      method: "POST",
      body: formData,
    });
    const body = (await res.json()) as { error?: string; path?: string };
    if (!res.ok || !body.path) {
      throw new Error(body.error ?? "Image upload failed.");
    }
    return body.path;
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="hmi-hero-chrome font-mono text-accent">Daedalus Sky</p>
          <h1 className="text-2xl font-semibold text-foreground">Members</h1>
          <p className="mt-1 text-sm text-muted">
            Manage organization members and roster-ready roles.
          </p>
          <OrgPrimaryNav currentPath="/members" />
        </div>
      </header>

      <section className="rounded-xl border border-border bg-surface p-5 shadow-[inset_0_1px_0_0_var(--grid-strong)]">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted">
          Add member
        </h2>
        {!canCreate ? (
          <p className="mt-3 rounded border border-border/70 bg-background/40 px-3 py-2 font-mono text-xs text-muted">
            Only organization owner/admin can add members.
          </p>
        ) : null}

        <form onSubmit={(e) => void onSubmit(e)} className="mt-4 grid gap-3 md:grid-cols-4">
          <input
            type="text"
            placeholder="Display name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            disabled={!canCreate || saving}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none ring-accent/40 focus:ring-2 disabled:opacity-50"
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={!canCreate || saving}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none ring-accent/40 focus:ring-2 disabled:opacity-50"
            required
          />
          <select
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            disabled={!canCreate || saving}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none ring-accent/40 focus:ring-2 disabled:opacity-50"
          >
            <option value="">Position (optional)</option>
            {POSITION_OPTIONS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as MemberRole)}
            disabled={!canCreate || saving}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none ring-accent/40 focus:ring-2 disabled:opacity-50"
          >
            {ROLE_OPTIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={!canCreate || saving}
            className="rounded-md border border-accent/50 bg-accent/15 px-4 py-2 font-mono text-sm font-medium text-accent hover:bg-accent/25 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Add member"}
          </button>
          <input
            type="date"
            value={dateOfBirth}
            onChange={(e) => setDateOfBirth(e.target.value)}
            disabled={!canCreate || saving}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none ring-accent/40 focus:ring-2 disabled:opacity-50"
          />
          <input
            type="text"
            placeholder="Employee ID"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            disabled={!canCreate || saving}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none ring-accent/40 focus:ring-2 disabled:opacity-50"
          />
          <input
            type="date"
            value={hireDate}
            onChange={(e) => setHireDate(e.target.value)}
            disabled={!canCreate || saving}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none ring-accent/40 focus:ring-2 disabled:opacity-50"
          />
          <input
            type="number"
            step="0.01"
            placeholder="Weight (lbs)"
            value={weightLbs}
            onChange={(e) => setWeightLbs(e.target.value)}
            disabled={!canCreate || saving}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none ring-accent/40 focus:ring-2 disabled:opacity-50"
          />
          <input
            type="number"
            step="0.01"
            placeholder="Years flight experience"
            value={yearsFlightExperience}
            onChange={(e) => setYearsFlightExperience(e.target.value)}
            disabled={!canCreate || saving}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none ring-accent/40 focus:ring-2 disabled:opacity-50"
          />
          <input
            type="number"
            step="0.01"
            placeholder="Total years experience"
            value={totalYearsExperience}
            onChange={(e) => setTotalYearsExperience(e.target.value)}
            disabled={!canCreate || saving}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none ring-accent/40 focus:ring-2 disabled:opacity-50"
          />
          <input
            type="text"
            placeholder="Mobile number"
            value={mobileNumber}
            onChange={(e) => setMobileNumber(e.target.value)}
            disabled={!canCreate || saving}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none ring-accent/40 focus:ring-2 disabled:opacity-50"
          />
          <select
            value={mobileCarrier}
            onChange={(e) => setMobileCarrier(e.target.value)}
            disabled={!canCreate || saving}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none ring-accent/40 focus:ring-2 disabled:opacity-50"
          >
            <option value="">Carrier (optional)</option>
            {CARRIER_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Flight suit size"
            value={flightSuitSize}
            onChange={(e) => setFlightSuitSize(e.target.value)}
            disabled={!canCreate || saving}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none ring-accent/40 focus:ring-2 disabled:opacity-50"
          />
          <input
            type="text"
            placeholder="T-shirt size"
            value={tShirtSize}
            onChange={(e) => setTShirtSize(e.target.value)}
            disabled={!canCreate || saving}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none ring-accent/40 focus:ring-2 disabled:opacity-50"
          />
          <input
            type="text"
            placeholder="Gender"
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            disabled={!canCreate || saving}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none ring-accent/40 focus:ring-2 disabled:opacity-50"
          />
          <input
            type="text"
            placeholder="Emergency contact name"
            value={emergencyContactName}
            onChange={(e) => setEmergencyContactName(e.target.value)}
            disabled={!canCreate || saving}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none ring-accent/40 focus:ring-2 disabled:opacity-50 md:col-span-2"
          />
          <input
            type="text"
            placeholder="Emergency contact phone"
            value={emergencyContactPhone}
            onChange={(e) => setEmergencyContactPhone(e.target.value)}
            disabled={!canCreate || saving}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none ring-accent/40 focus:ring-2 disabled:opacity-50"
          />
          <input
            type="text"
            placeholder="Emergency contact address"
            value={emergencyContactAddress}
            onChange={(e) => setEmergencyContactAddress(e.target.value)}
            disabled={!canCreate || saving}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none ring-accent/40 focus:ring-2 disabled:opacity-50 md:col-span-3"
          />
          <label className="rounded-md border border-border bg-background px-3 py-2 text-sm text-muted md:col-span-2">
            Profile photo (optional)
            <input
              type="file"
              accept="image/*"
              disabled={!canCreate || saving}
              className="mt-1 block w-full text-xs"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) {
                  setPhotoFile(null);
                  return;
                }
                setPhotoFile(file);
              }}
            />
          </label>
          <input
            type="text"
            placeholder="Certification type (optional)"
            value={certificationType}
            onChange={(e) => setCertificationType(e.target.value)}
            disabled={!canCreate || saving}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none ring-accent/40 focus:ring-2 disabled:opacity-50"
          />
          <input
            type="date"
            value={certificationIssueDate}
            onChange={(e) => setCertificationIssueDate(e.target.value)}
            disabled={!canCreate || saving}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none ring-accent/40 focus:ring-2 disabled:opacity-50"
          />
          <input
            type="date"
            value={certificationExpirationDate}
            onChange={(e) => setCertificationExpirationDate(e.target.value)}
            disabled={!canCreate || saving}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none ring-accent/40 focus:ring-2 disabled:opacity-50"
          />
          <input
            type="text"
            placeholder="Certification issuing entity"
            value={certificationIssuingEntity}
            onChange={(e) => setCertificationIssuingEntity(e.target.value)}
            disabled={!canCreate || saving}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none ring-accent/40 focus:ring-2 disabled:opacity-50"
          />
          <label className="rounded-md border border-border bg-background px-3 py-2 text-sm text-muted md:col-span-2">
            Certification image (optional)
            <input
              type="file"
              accept="image/*"
              disabled={!canCreate || saving}
              className="mt-1 block w-full text-xs"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) {
                  setCertificationImageFile(null);
                  return;
                }
                setCertificationImageFile(file);
              }}
            />
          </label>
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
          Organization members
        </h2>
        {loading ? (
          <p className="mt-4 font-mono text-sm text-muted">Loading members…</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border/80 text-xs uppercase tracking-wide text-muted">
                  <th className="px-2 py-2 font-semibold">Name</th>
                  <th className="px-2 py-2 font-semibold">Email</th>
                  <th className="px-2 py-2 font-semibold">Position</th>
                  <th className="px-2 py-2 font-semibold">Role</th>
                  <th className="px-2 py-2 font-semibold">Status</th>
                  <th className="px-2 py-2 font-semibold">Weight (lbs)</th>
                  <th className="px-2 py-2 font-semibold">Mobile</th>
                  <th className="px-2 py-2 font-semibold">Employee ID</th>
                  <th className="px-2 py-2 font-semibold">Auth</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr key={member.id} className="border-b border-border/40">
                    <td className="px-2 py-2 text-foreground">{member.displayName}</td>
                    <td className="px-2 py-2 text-muted">{member.email ?? "—"}</td>
                    <td className="px-2 py-2 text-muted">{member.position ?? "—"}</td>
                    <td className="px-2 py-2 font-mono text-foreground">{member.role}</td>
                    <td className="px-2 py-2 font-mono text-parchment-dim">{member.status}</td>
                    <td className="px-2 py-2 font-mono text-muted">
                      {member.weightLbs ?? "—"}
                    </td>
                    <td className="px-2 py-2 font-mono text-muted">
                      {member.mobileNumber ?? "—"}
                    </td>
                    <td className="px-2 py-2 font-mono text-muted">
                      {member.employeeId ?? "—"}
                    </td>
                    <td className="px-2 py-2 font-mono text-muted">
                      {member.authProvider ?? "—"}
                    </td>
                  </tr>
                ))}
                {members.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-2 py-5 text-center text-muted">
                      No members found for this organization yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
