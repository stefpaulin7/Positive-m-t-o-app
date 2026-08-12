import type { WeatherData } from "./types";
import { fetchText } from "./xml";
import { parseCitypageWeather } from "./parse";

const CACHE_TTL_MS = 10 * 60 * 1000; // les flux Datamart sont régénérés ~toutes les heures

const cache = new Map<string, { data: WeatherData; fetchedAt: number }>();

function citypageUrl(province: string, code: string): string {
  return `https://dd.weather.gc.ca/citypage_weather/xml/${province.toUpperCase()}/${code}_f.xml`;
}

export async function getWeatherForSite(province: string, code: string): Promise<WeatherData> {
  const key = `${province.toUpperCase()}/${code}`;
  const cached = cache.get(key);
  const now = Date.now();
  if (cached && now - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.data;
  }

  const xml = await fetchText(citypageUrl(province, code));
  const data = parseCitypageWeather(xml);
  cache.set(key, { data, fetchedAt: now });
  return data;
}
