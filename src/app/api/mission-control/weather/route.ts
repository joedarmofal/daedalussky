import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { createClient } from "@/utils/supabase/server";
import { fetchRegionalWeather } from "@/lib/mission-control/open-meteo";

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
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

  try {
    const weather = await fetchRegionalWeather(lat, lon);
    return NextResponse.json(weather);
  } catch {
    return NextResponse.json(
      { error: "Weather provider unavailable" },
      { status: 502 },
    );
  }
}
