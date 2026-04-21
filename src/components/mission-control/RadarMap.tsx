"use client";

import type { ReactElement } from "react";
import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export type RadarMapProps = {
  lat: number;
  lon: number;
};

/**
 * Dark basemap + RainViewer radar overlay for regional precipitation.
 * RainViewer tiles are subject to their terms of use; attribution retained on map.
 */
export function RadarMap({ lat, lon }: RadarMapProps): ReactElement {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) {
      return;
    }

    const map = L.map(el, { zoomControl: true }).setView([lat, lon], 7);

    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 19,
      },
    ).addTo(map);

    let cancelled = false;

    void (async () => {
      try {
        const res = await fetch(
          "https://api.rainviewer.com/public/weather-maps.json",
        );
        if (!res.ok || cancelled) {
          return;
        }
        const data = (await res.json()) as {
          radar?: { past?: { path: string }[] };
        };
        const past = data.radar?.past;
        const latest = past?.[past.length - 1];
        if (!latest?.path || cancelled) {
          return;
        }
        const radarUrl = `https://tilecache.rainviewer.com${latest.path}/256/{z}/{x}/{y}/2/1_1.png`;
        L.tileLayer(radarUrl, {
          opacity: 0.58,
          maxNativeZoom: 9,
          maxZoom: 12,
          attribution:
            '<a href="https://www.rainviewer.com/">RainViewer</a> radar',
        }).addTo(map);
      } catch {
        /* radar overlay optional */
      }
    })();

    return () => {
      cancelled = true;
      map.remove();
    };
  }, [lat, lon]);

  return (
    <div
      ref={containerRef}
      className="z-0 min-h-[380px] w-full rounded-sm border border-border bg-[#05070c] sm:min-h-[440px]"
      role="img"
      aria-label="Regional weather radar map centered on your location"
    />
  );
}
