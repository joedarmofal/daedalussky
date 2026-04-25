"use client";

import { onAuthStateChanged } from "firebase/auth";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { getFirebaseAuth } from "@firebase-config";
import { authedFetch } from "@/lib/authed-fetch";
import { isAuthDevBypassEnabled } from "@/lib/auth-dev-bypass";
import { isOrgAdminRole } from "@/lib/org-roles";

export type OrgMemberProfile = {
  id: string;
  organizationId: string;
  displayName: string;
  email: string | null;
  role: string;
  status: string;
  position: string | null;
  mobileNumber: string | null;
  mobileCarrier: string | null;
  flightSuitSize: string | null;
  tShirtSize: string | null;
  gender: string | null;
  employeeId: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  emergencyContactAddress: string | null;
  photoDataUrl: string | null;
};

export type OrgOrganization = {
  id: string;
  slug: string;
  displayName: string;
  legalName: string;
  status: string;
};

type OrgContextValue = {
  loading: boolean;
  error: string | null;
  member: OrgMemberProfile | null;
  organization: OrgOrganization | null;
  refetch: () => Promise<void>;
  isOrgAdmin: boolean;
};

const OrgContext = createContext<OrgContextValue | null>(null);

export function OrgProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(
    () => isAuthDevBypassEnabled() || getFirebaseAuth() !== null,
  );
  const [error, setError] = useState<string | null>(null);
  const [member, setMember] = useState<OrgMemberProfile | null>(null);
  const [organization, setOrganization] = useState<OrgOrganization | null>(null);

  const loadMe = useCallback(async () => {
    const bypass = isAuthDevBypassEnabled();
    const auth = getFirebaseAuth();
    if (!bypass && (!auth || !auth.currentUser)) {
      setMember(null);
      setOrganization(null);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await authedFetch("/api/auth/me", { cache: "no-store" });
      const body = (await res.json()) as {
        member?: OrgMemberProfile;
        organization?: OrgOrganization;
        error?: string;
      };
      if (!res.ok) {
        setMember(null);
        setOrganization(null);
        setError(body.error ?? "Could not load organization context.");
        return;
      }
      setMember(body.member ?? null);
      setOrganization(body.organization ?? null);
    } catch {
      setMember(null);
      setOrganization(null);
      setError("Could not load organization context.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthDevBypassEnabled()) {
      queueMicrotask(() => {
        void loadMe();
      });
      return;
    }
    const auth = getFirebaseAuth();
    if (!auth) {
      return;
    }
    const unsub = onAuthStateChanged(auth, () => {
      void loadMe();
    });
    return () => unsub();
  }, [loadMe]);

  const value = useMemo<OrgContextValue>(
    () => ({
      loading,
      error,
      member,
      organization,
      refetch: loadMe,
      isOrgAdmin: isOrgAdminRole(member?.role),
    }),
    [loading, error, member, organization, loadMe],
  );

  return <OrgContext.Provider value={value}>{children}</OrgContext.Provider>;
}

export function useOrg(): OrgContextValue {
  const ctx = useContext(OrgContext);
  if (!ctx) {
    throw new Error("useOrg must be used within OrgProvider");
  }
  return ctx;
}
