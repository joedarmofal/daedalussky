import { NextResponse } from "next/server";

import { logSafeAudit } from "@/lib/security";

export function GET(): NextResponse {
  logSafeAudit({
    event: "health_check",
    outcome: "success",
  });

  return NextResponse.json(
    { status: "ok", service: "daedalussky-health" },
    { status: 200 },
  );
}
