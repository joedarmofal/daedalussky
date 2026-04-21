import type { MissionControlTfrItem, MissionControlTfrPayload } from "@/types/mission-control";

import { haversineKm } from "./geo";

const AIRFRAMES_TFR_GEOJSON =
  "https://raw.githubusercontent.com/airframesio/data/master/json/faa/tfrs.geojson" as const;

const FAA_TFR_LIST = "https://tfr.faa.gov/tfr2/list.html" as const;

type GeoJsonFeature = {
  type?: string;
  geometry?: {
    type?: string;
    coordinates?: unknown;
  };
  properties?: Record<string, unknown> | null;
};

type GeoJsonCollection = {
  type?: string;
  features?: GeoJsonFeature[];
};

function flattenRingCoords(ring: unknown): [number, number][] {
  if (!Array.isArray(ring)) {
    return [];
  }
  const out: [number, number][] = [];
  for (const pt of ring) {
    if (
      Array.isArray(pt) &&
      typeof pt[0] === "number" &&
      typeof pt[1] === "number"
    ) {
      out.push([pt[0], pt[1]]);
    }
  }
  return out;
}

function geometrySamplePoints(geometry: GeoJsonFeature["geometry"]): [number, number][] {
  if (!geometry?.coordinates) {
    return [];
  }
  const coords = geometry.coordinates;
  const t = geometry.type;
  if (t === "Polygon" && Array.isArray(coords) && coords[0]) {
    return flattenRingCoords(coords[0]);
  }
  if (t === "MultiPolygon" && Array.isArray(coords)) {
    const pts: [number, number][] = [];
    for (const poly of coords) {
      if (Array.isArray(poly) && poly[0]) {
        pts.push(...flattenRingCoords(poly[0]));
      }
    }
    return pts;
  }
  return [];
}

function minDistanceKm(
  user: { lat: number; lon: number },
  lonLatPairs: [number, number][],
): number {
  let min = Number.POSITIVE_INFINITY;
  for (const [lon, lat] of lonLatPairs) {
    const d = haversineKm(user, { lat, lon });
    if (d < min) {
      min = d;
    }
  }
  return min;
}

function featureToItem(
  feature: GeoJsonFeature,
  index: number,
): MissionControlTfrItem | null {
  const p = feature.properties ?? {};
  const id = String(
    p.id ?? p.NOTAM ?? p.notam_id ?? p.NOTAM_ID ?? p.name ?? `tfr-${index}`,
  ).slice(0, 64);
  const summary = String(
    p.title ?? p.name ?? p.summary ?? "Temporary flight restriction",
  ).slice(0, 280);
  const validFrom =
    typeof p.start === "string"
      ? p.start
      : typeof p.validFrom === "string"
        ? p.validFrom
        : undefined;
  const validTo =
    typeof p.end === "string"
      ? p.end
      : typeof p.validTo === "string"
        ? p.validTo
        : undefined;
  if (!summary) {
    return null;
  }
  return {
    id,
    summary,
    validFrom,
    validTo,
    authority: "aggregate",
  };
}

function getDemoTfrs(): MissionControlTfrItem[] {
  return [
    {
      id: "DEMO-TFR-01",
      summary:
        "Simulated VIP movement ring — replace with FAA NOTAM feed in production.",
      validFrom: new Date().toISOString(),
      validTo: new Date(Date.now() + 36 * 3600 * 1000).toISOString(),
      authority: "demo",
    },
    {
      id: "DEMO-TFR-02",
      summary:
        "Simulated stadium TFR — shown only when MISSION_CONTROL_DEMO=true.",
      validFrom: new Date().toISOString(),
      validTo: new Date(Date.now() + 8 * 3600 * 1000).toISOString(),
      authority: "demo",
    },
  ];
}

/**
 * Loads TFR-shaped notices: optional Airframes aggregate GeoJSON (filtered by
 * rough distance), simulated rows when `MISSION_CONTROL_DEMO=true`, otherwise
 * empty with guidance to FAA sources.
 */
export async function loadTfrPayload(user: {
  lat: number;
  lon: number;
}): Promise<MissionControlTfrPayload> {
  const fetchedAt = new Date().toISOString();

  if (process.env.MISSION_CONTROL_DEMO === "true") {
    return {
      items: getDemoTfrs(),
      source: "demo",
      disclaimer:
        "Simulated TFRs for layout only. Use FAA NOTAM Search or your certified feed for operations.",
      fetchedAt,
    };
  }

  try {
    const res = await fetch(AIRFRAMES_TFR_GEOJSON, {
      next: { revalidate: 900 },
      headers: { Accept: "application/geo+json,application/json" },
    });
    if (!res.ok) {
      return emptyPayload(fetchedAt, "aggregate_unavailable");
    }
    const body = (await res.json()) as GeoJsonCollection;
    const features = body.features ?? [];
    const maxKm = 650;
    const items: MissionControlTfrItem[] = [];
    for (let i = 0; i < features.length; i++) {
      const f = features[i];
      if (!f || f.type !== "Feature") {
        continue;
      }
      const pts = geometrySamplePoints(f.geometry);
      if (pts.length === 0) {
        continue;
      }
      if (minDistanceKm(user, pts) > maxKm) {
        continue;
      }
      const item = featureToItem(f, i);
      if (item) {
        items.push(item);
      }
      if (items.length >= 20) {
        break;
      }
    }
    return {
      items,
      source: "airframesio_geojson",
      disclaimer:
        "Third-party aggregate GeoJSON (may be empty). Always verify against FAA NOTAM / Graphic TFRs before flight.",
      fetchedAt,
    };
  } catch {
    return emptyPayload(fetchedAt, "fetch_failed");
  }
}

function emptyPayload(fetchedAt: string, reason: string): MissionControlTfrPayload {
  return {
    items: [],
    source: reason,
    disclaimer: `No TFR rows returned (${reason}). Open the FAA graphic TFR list for authoritative data.`,
    fetchedAt,
  };
}

export function faaTfrListUrl(): string {
  return FAA_TFR_LIST;
}
