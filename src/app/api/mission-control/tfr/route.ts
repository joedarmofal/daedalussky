import { NextResponse } from "next/server";

import { getRequesterFromRequest } from "@/lib/api-auth";
import { loadTfrPayload } from "@/lib/mission-control/tfr-feed";

function parseCoord(name: string, value: string | null): number | null {
  if (value === null || value === "") {
    return null;
  }
  const n = Number.parseFloat(value);
  if (!Number.isFinite(n)) {
    return null;
  }
  if (name === "lat" && (n < -90 || n > 90)) {
    return null;
  }
  if (name === "lon" && (n < -180 || n > 180)) {
    return null;
  }
  return n;
}

export async function GET(request: Request): Promise<NextResponse> {
  const authResult = await getRequesterFromRequest(request);
  if ("error" in authResult) {
    return authResult.error;
  }

  const { searchParams } = new URL(request.url);
  const lat = parseCoord("lat", searchParams.get("lat"));
  const lon = parseCoord("lon", searchParams.get("lon"));
  if (lat === null || lon === null) {
    return NextResponse.json(
      { error: "Invalid or missing lat/lon query parameters" },
      { status: 400 },
    );
  }

  const payload = await loadTfrPayload({ lat, lon });
  return NextResponse.json(payload);
}
