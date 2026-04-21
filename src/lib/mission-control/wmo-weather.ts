/** WMO weather interpretation (Open-Meteo weather_code). */
export function wmoWeatherLabel(code: number): string {
  if (code === 0) {
    return "Clear";
  }
  if (code <= 3) {
    return "Mainly clear / partly cloudy / overcast";
  }
  if (code <= 48) {
    return "Fog / depositing rime fog";
  }
  if (code <= 57) {
    return "Drizzle";
  }
  if (code <= 67) {
    return "Rain / freezing rain";
  }
  if (code <= 77) {
    return "Snow / snow grains";
  }
  if (code <= 82) {
    return "Rain showers";
  }
  if (code <= 86) {
    return "Snow showers";
  }
  if (code <= 99) {
    return "Thunderstorm / hail";
  }
  return "Weather";
}
