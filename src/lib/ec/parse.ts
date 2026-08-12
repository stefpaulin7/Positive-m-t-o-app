import { popToSunshineChance } from "@/lib/positivity";
import { asArray, nodeAttr, nodeText, parseXml, toFloat, toInt } from "./xml";
import type {
  CurrentConditions,
  ForecastPeriod,
  HourlyForecastEntry,
  RiseSet,
  WeatherAlert,
  WeatherData,
} from "./types";

/**
 * Parseur du flux XML "citypage_weather" d'Environnement Canada
 * (https://dd.weather.gc.ca/citypage_weather/xml/<PROV>/<code>_f.xml).
 *
 * Le format n'est pas garanti à 100 % section par section : chaque section
 * est parsée de façon défensive (essais de plusieurs noms de balises
 * plausibles) et une section absente/imprévue produit une liste vide plutôt
 * qu'une exception, pour que l'appli reste utilisable même si une partie du
 * flux diffère de ce qui est documenté.
 */
export function parseCitypageWeather(xml: string): WeatherData {
  const root = parseXml(xml) as Record<string, unknown>;
  const siteData = (root.siteData ?? root) as Record<string, unknown>;

  const location = (siteData.location ?? {}) as Record<string, unknown>;
  const nameNode = location.name as Record<string, unknown> | undefined;
  const provinceNode = location.province as Record<string, unknown> | undefined;

  const current = parseCurrentConditions(siteData.currentConditions);
  const daily = parseForecastGroup(siteData.forecastGroup);
  const hourly = parseHourlyForecastGroup(siteData.hourlyForecastGroup);
  const riseSet = parseRiseSet(siteData.riseSet);
  const alerts = parseWarnings(siteData.warnings);

  return {
    location: {
      nameEn: nodeText(nameNode) ?? "",
      nameFr: nodeText(nameNode) ?? "",
      province: nodeAttr(provinceNode, "code") ?? nodeText(provinceNode) ?? "",
      latitude: toFloat(location.latitude ?? nodeAttrFallback(nameNode, "lat")),
      longitude: toFloat(location.longitude ?? nodeAttrFallback(nameNode, "lon")),
    },
    current,
    daily,
    hourly,
    riseSet,
    alerts,
    sourceUpdatedAt: extractLatestDateTime(siteData.currentConditions),
  };
}

function nodeAttrFallback(node: unknown, attr: string): string | null {
  return nodeAttr(node, attr);
}

function extractLatestDateTime(currentConditions: unknown): string | null {
  const cc = (currentConditions ?? {}) as Record<string, unknown>;
  const dts = asArray(cc.dateTime);
  const utc = dts.find((d) => nodeAttr(d, "zone") === "UTC");
  return nodeText(utc ?? dts[0]);
}

function parseCurrentConditions(raw: unknown): CurrentConditions {
  const cc = (raw ?? {}) as Record<string, unknown>;
  const wind = (cc.wind ?? {}) as Record<string, unknown>;

  const feelsLike = cc.windChill ?? cc.humidex ?? null;

  return {
    stationName: nodeText(cc.station),
    observedAt: extractLatestDateTime(raw),
    condition: nodeText(cc.condition),
    iconCode: nodeText(cc.iconCode),
    temperatureC: toFloat(cc.temperature),
    feelsLikeC: toFloat(feelsLike),
    dewpointC: toFloat(cc.dewpoint),
    pressureKPa: toFloat(cc.pressure),
    pressureTendency: nodeAttr(cc.pressure, "tendency"),
    visibilityKm: toFloat(cc.visibility),
    humidityPct: toFloat(cc.relativeHumidity),
    windSpeedKmh: toFloat(wind.speed),
    windGustKmh: toFloat(wind.gust),
    windDirection: nodeText(wind.direction),
    uvIndex: toInt((cc.uvIndex as Record<string, unknown> | undefined)?.index ?? cc.uvIndex),
  };
}

function parseForecastGroup(raw: unknown): ForecastPeriod[] {
  const group = (raw ?? {}) as Record<string, unknown>;
  const forecasts = asArray(group.forecast);

  return forecasts.map((f) => {
    const forecast = f as Record<string, unknown>;
    const period = forecast.period as Record<string, unknown> | undefined;
    const periodName =
      nodeAttr(period, "textForecastName") ?? nodeText(period) ?? "Prévision";
    const isNight = /nuit|soir|ce soir|tonight|night/i.test(periodName);

    const abbreviated = (forecast.abbreviatedForecast ?? {}) as Record<string, unknown>;
    const precipitation = (forecast.precipitation ?? {}) as Record<string, unknown>;
    const pop = toInt(abbreviated.pop ?? precipitation.pop);

    const temperatures = asArray(
      (forecast.temperatures as Record<string, unknown> | undefined)?.temperature
    );
    const high = temperatures.find((t) => nodeAttr(t, "class") === "high");
    const low = temperatures.find((t) => nodeAttr(t, "class") === "low");

    const uvNode = forecast.uv as Record<string, unknown> | undefined;

    return {
      periodName,
      isNight,
      textSummary: nodeText(forecast.textSummary),
      condition: nodeText(abbreviated.textSummary) ?? nodeText(forecast.textSummary),
      iconCode: nodeText(abbreviated.iconCode),
      precipProbabilityPct: pop,
      sunshineChancePct: popToSunshineChance(pop),
      tempHighC: toFloat(high),
      tempLowC: toFloat(low),
      windSummary: nodeText((forecast.winds as Record<string, unknown> | undefined)?.textSummary),
      uvIndex: toInt(uvNode?.index),
    } satisfies ForecastPeriod;
  });
}

function parseHourlyForecastGroup(raw: unknown): HourlyForecastEntry[] {
  const group = (raw ?? {}) as Record<string, unknown>;
  const hours = asArray(group.hourlyForecast);

  return hours.map((h) => {
    const hour = h as Record<string, unknown>;
    const pop = toInt(hour.lop ?? hour.pop);
    return {
      timeUTC:
        nodeAttr(hour, "dateTimeUTC") ?? nodeAttr(hour, "dateUTC") ?? nodeText(hour.dateTime) ?? "",
      condition: nodeText(hour.condition),
      iconCode: nodeText(hour.iconCode),
      temperatureC: toFloat(hour.temperature),
      precipProbabilityPct: pop,
      sunshineChancePct: popToSunshineChance(pop),
    } satisfies HourlyForecastEntry;
  });
}

function parseRiseSet(raw: unknown): RiseSet {
  const group = (raw ?? {}) as Record<string, unknown>;
  const entries = asArray(group.dateTime);
  const sunrise = entries.find((e) => nodeAttr(e, "name") === "sunrise");
  const sunset = entries.find((e) => nodeAttr(e, "name") === "sunset");
  return {
    sunrise: nodeText(sunrise),
    sunset: nodeText(sunset),
  };
}

function parseWarnings(raw: unknown): WeatherAlert[] {
  const group = (raw ?? {}) as Record<string, unknown>;
  const events = asArray(group.event);
  return events
    .map((e) => {
      const type = nodeAttr(e, "type") ?? "watch";
      const description = nodeAttr(e, "description") ?? nodeText(e) ?? "";
      const url = nodeAttr(e, "url");
      return { type, description, url } satisfies WeatherAlert;
    })
    .filter((a) => a.description.length > 0);
}
