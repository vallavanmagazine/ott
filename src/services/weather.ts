/**
 * Weather for the broadcast overlay. Uses Open-Meteo (free, no API key).
 * Maps a handful of TN cities to coordinates; defaults to Chennai.
 */
export interface Weather {
  tempC: number;
  code: number;
  label: string;
  day: string;
}

const CITY_COORDS: Record<string, [number, number]> = {
  Chennai: [13.08, 80.27],
  Coimbatore: [11.02, 76.96],
  Madurai: [9.93, 78.12],
  Tiruchirappalli: [10.79, 78.7],
  Salem: [11.66, 78.15],
  Tirunelveli: [8.71, 77.76],
  Nilgiris: [11.41, 76.7],
  Thanjavur: [10.79, 79.14],
};

function weatherLabel(code: number): string {
  if (code === 0) return 'Clear';
  if (code <= 3) return 'Partly Cloudy';
  if (code <= 48) return 'Foggy';
  if (code <= 67) return 'Rainy';
  if (code <= 77) return 'Snow';
  if (code <= 82) return 'Showers';
  if (code <= 99) return 'Thunderstorm';
  return 'Cloudy';
}

export async function fetchWeather(city = 'Chennai'): Promise<Weather | null> {
  const [lat, lon] = CITY_COORDS[city] ?? CITY_COORDS.Chennai;
  const day = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code`,
      { signal: AbortSignal.timeout(5000) },
    );
    if (!res.ok) return null;
    const data = await res.json();
    const cur = data.current;
    return {
      tempC: Math.round(cur.temperature_2m),
      code: cur.weather_code,
      label: weatherLabel(cur.weather_code),
      day,
    };
  } catch {
    return null;
  }
}
