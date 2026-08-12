// Types normalisés pour les données "Citypage Weather" d'Environnement Canada
// (https://dd.weather.gc.ca/citypage_weather/). Le XML source est plus verbeux;
// on ne garde ici que ce dont l'appli a besoin.

export interface EcSite {
  code: string; // ex: "s0000635"
  province: string; // ex: "QC"
  nameEn: string;
  nameFr: string;
  latitude: number;
  longitude: number;
}

export interface CurrentConditions {
  stationName: string | null;
  observedAt: string | null;
  condition: string | null;
  iconCode: string | null;
  temperatureC: number | null;
  feelsLikeC: number | null; // windchill ou humidex selon la saison
  dewpointC: number | null;
  pressureKPa: number | null;
  pressureTendency: string | null;
  visibilityKm: number | null;
  humidityPct: number | null;
  windSpeedKmh: number | null;
  windGustKmh: number | null;
  windDirection: string | null;
  uvIndex: number | null;
}

export interface ForecastPeriod {
  periodName: string; // ex: "Aujourd'hui", "Ce soir", "Mardi"
  isNight: boolean;
  textSummary: string | null;
  condition: string | null;
  iconCode: string | null;
  precipProbabilityPct: number | null; // "pop" brut d'Environnement Canada
  sunshineChancePct: number; // 100 - pop, la métrique "positive" de l'appli
  tempHighC: number | null;
  tempLowC: number | null;
  windSummary: string | null;
  uvIndex: number | null;
}

export interface HourlyForecastEntry {
  timeUTC: string;
  condition: string | null;
  iconCode: string | null;
  temperatureC: number | null;
  precipProbabilityPct: number | null;
  sunshineChancePct: number;
}

export interface WeatherAlert {
  type: string; // ex: "warning", "watch", "statement"
  description: string;
  url: string | null;
}

export interface RiseSet {
  sunrise: string | null;
  sunset: string | null;
}

export interface WeatherData {
  location: {
    nameEn: string;
    nameFr: string;
    province: string;
    latitude: number | null;
    longitude: number | null;
  };
  current: CurrentConditions;
  daily: ForecastPeriod[];
  hourly: HourlyForecastEntry[];
  riseSet: RiseSet;
  alerts: WeatherAlert[];
  sourceUpdatedAt: string | null;
}
