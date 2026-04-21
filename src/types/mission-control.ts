/** Regional weather (Open-Meteo subset). */
export type MissionControlWeather = {
  latitude: number;
  longitude: number;
  timezone: string;
  current: {
    temperatureF: number;
    relativeHumidity: number;
    windMph: number;
    windDirectionDeg: number;
    weatherCode: number;
    time: string;
  };
  daily: {
    date: string;
    weatherCode: number;
    tempMinF: number;
    tempMaxF: number;
  }[];
};

export type MissionControlTfrItem = {
  id: string;
  summary: string;
  validFrom?: string;
  validTo?: string;
  /** Lower severity for aggregate / third-party feeds. */
  authority: "faa" | "aggregate" | "demo";
};

export type MissionControlTfrPayload = {
  items: MissionControlTfrItem[];
  source: string;
  /** Shown in UI when data is simulated or incomplete. */
  disclaimer?: string;
  fetchedAt: string;
};

export type MissionControlKpis = {
  flightHoursMtd: number;
  dispatchSlaPct: number;
  certificationsDue30d: number;
  activeTfrsNearby: number;
  /** ISO timestamp when KPI snapshot was built. */
  generatedAt: string;
};
