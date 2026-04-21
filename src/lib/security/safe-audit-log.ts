/**
 * HIPAA-conscious audit helpers: never include PHI/PII in payloads.
 * Prefer stable event names and opaque correlation IDs only.
 */

export type AuditSeverity = "info" | "warn" | "error";

export type SafeAuditEvent = {
  event: string;
  severity?: AuditSeverity;
  /** Non-human opaque identifier (e.g. ULID), not a medical record number */
  correlationId?: string;
  outcome?: "success" | "failure";
};

export function logSafeAudit(event: SafeAuditEvent): void {
  if (process.env.NODE_ENV === "test") {
    return;
  }
  const payload = {
    ...event,
    timestamp: new Date().toISOString(),
  };
  // Intentionally avoid console levels that might attach stack traces with request context in some hosts.
  console.info("[audit]", JSON.stringify(payload));
}
