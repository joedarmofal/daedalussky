import type { MissionControlWeather } from "@/types/mission-control";

const BASE = "https://api.open-meteo.com/v1/forecast" as const;

export async function fetchRegionalWeather(
  lat: number,
  lon: number,
): Promise<MissionControlWeather> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    current: [
      "temperature_2m",
      "relative_humidity_2m",
      "wind_speed_10m",
      "wind_direction_10m",
      "weather_code",
    ].join(","),
    hourly: "precipitation_probability",
    daily: ["weather_code", "temperature_2m_max", "temperature_2m_min"].join(
      ",",
    ),
    temperature_unit: "fahrenheit",
    wind_speed_unit: "mph",
    timezone: "auto",
  });

  const res = await fetch(`${BASE}?${params.toString()}`, {
    next: { revalidate: 600 },
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    throw new Error(`Open-Meteo error: ${res.status}`);
  }

  const data = (await res.json()) as {
    latitude: number;
    longitude: number;
    timezone: string;
    current: {
      time: string;
      temperature_2m: number;
      relative_humidity_2m: number;
      wind_speed_10m: number;
      wind_direction_10m: number;
      weather_code: number;
    };
    daily: {
      time: string[];
      weather_code: number[];
      temperature_2m_max: number[];
      temperature_2m_min: number[];
    };
  };

  const daily: MissionControlWeather["daily"] = [];
  const n = data.daily.time.length;
  for (let i = 0; i < n; i++) {
    const date = data.daily.time[i];
    const weatherCode = data.daily.weather_code[i];
    const tempMinF = data.daily.temperature_2m_min[i];
    const tempMaxF = data.daily.temperature_2m_max[i];
    if (
      date !== undefined &&
      weatherCode !== undefined &&
      tempMinF !== undefined &&
      tempMaxF !== undefined
    ) {
      daily.push({ date, weatherCode, tempMinF, tempMaxF });
    }
  }

  return {
    latitude: data.latitude,
    longitude: data.longitude,
    timezone: data.timezone,
    current: {
      temperatureF: data.current.temperature_2m,
      relativeHumidity: data.current.relative_humidity_2m,
      windMph: data.current.wind_speed_10m,
      windDirectionDeg: data.current.wind_direction_10m,
      weatherCode: data.current.weather_code,
      time: data.current.time,
    },
    daily,
  };
}
