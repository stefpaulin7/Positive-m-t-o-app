"use client";

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import SearchBar from "@/components/SearchBar";
import CurrentWeatherCard from "@/components/CurrentWeatherCard";
import ForecastList from "@/components/ForecastList";
import HourlyStrip from "@/components/HourlyStrip";
import AlertBanner from "@/components/AlertBanner";
import type { EcSite, WeatherData } from "@/lib/ec/types";

const LAST_SITE_KEY = "positive-meteo:last-site";

function subscribeNever() {
  return () => {};
}
function getLastSiteSnapshot() {
  return window.localStorage.getItem(LAST_SITE_KEY);
}
function getLastSiteServerSnapshot() {
  return null;
}

export default function Home() {
  // Ville choisie explicitement pendant cette session (recherche / géoloc).
  const [selectedSite, setSelectedSite] = useState<EcSite | null>(null);
  // Dernière ville mémorisée localement, lue via un store externe (pas d'effet
  // nécessaire, et gère nativement l'écart serveur/client au premier rendu).
  const lastSiteRaw = useSyncExternalStore(
    subscribeNever,
    getLastSiteSnapshot,
    getLastSiteServerSnapshot
  );
  const lastSite = useMemo<EcSite | null>(() => {
    if (!lastSiteRaw) return null;
    try {
      return JSON.parse(lastSiteRaw) as EcSite;
    } catch {
      return null;
    }
  }, [lastSiteRaw]);
  const site = selectedSite ?? lastSite;

  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const setSite = (s: EcSite) => {
    window.localStorage.setItem(LAST_SITE_KEY, JSON.stringify(s));
    setSelectedSite(s);
  };

  const loadWeather = useCallback(async (s: EcSite) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/weather?province=${s.province}&code=${s.code}`);
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Erreur inconnue");
      }
      const data = await res.json();
      setWeather(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de charger la météo.");
      setWeather(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!site) return;
    // Chargement réseau déclenché par un changement de ville : le
    // loading/error/data qui en résulte est un effet de bord légitime, pas
    // un état dérivable au rendu.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadWeather(site);
  }, [site, loadWeather]);

  const handleUseLocation = () => {
    setLocationError(null);
    if (!("geolocation" in navigator)) {
      setLocationError("La géolocalisation n'est pas disponible sur cet appareil.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(
            `/api/sites?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`
          );
          const data = await res.json();
          const nearest: EcSite | undefined = data.sites?.[0];
          if (nearest) setSite(nearest);
          else setLocationError("Aucune station météo trouvée près de vous.");
        } catch {
          setLocationError("Impossible de trouver votre position.");
        } finally {
          setLocating(false);
        }
      },
      () => {
        setLocationError("Localisation refusée ou indisponible.");
        setLocating(false);
      },
      { timeout: 10_000 }
    );
  };

  const todayForecast = weather?.daily?.[0] ?? null;
  const sunshine = todayForecast?.sunshineChancePct ?? 60;
  const bgGradient =
    sunshine >= 70
      ? "from-amber-200 via-orange-100 to-sky-100"
      : sunshine >= 45
        ? "from-sky-200 via-amber-50 to-sky-100"
        : "from-slate-200 via-sky-100 to-slate-100";

  return (
    <main className={`flex min-h-screen flex-col bg-gradient-to-b ${bgGradient}`}>
      <div className="safe-top safe-bottom mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-4 pb-8">
        <header className="pt-2 text-center">
          <h1 className="text-2xl font-bold text-slate-800">☀️ Météo Positive</h1>
          <p className="text-sm text-slate-500">
            Vos chances de soleil, pas vos risques de pluie — données Environnement Canada.
          </p>
        </header>

        <SearchBar
          onSelect={setSite}
          onUseLocation={handleUseLocation}
          locating={locating}
          locationError={locationError}
          currentCityName={weather?.location.nameFr || site?.nameFr}
        />

        {loading && (
          <div className="mt-6 animate-pulse rounded-3xl bg-white/60 p-6 text-center text-slate-500">
            Chargement de la météo…
          </div>
        )}

        {error && !loading && (
          <div className="rounded-2xl bg-rose-100 px-4 py-3 text-sm text-rose-800 ring-1 ring-rose-300">
            {error}
          </div>
        )}

        {!site && !loading && (
          <div className="mt-8 flex flex-1 flex-col items-center justify-center gap-2 text-center text-slate-500">
            <span className="text-5xl" aria-hidden>
              🌤️
            </span>
            <p>Cherchez une ville ou utilisez votre position pour voir vos chances de soleil.</p>
          </div>
        )}

        {weather && !loading && (
          <div className="flex flex-col gap-4">
            <AlertBanner alerts={weather.alerts} />
            <CurrentWeatherCard
              locationName={weather.location.nameFr || site?.nameFr || ""}
              current={weather.current}
              todayForecast={todayForecast}
            />
            {(weather.riseSet.sunrise || weather.riseSet.sunset) && (
              <div className="flex justify-around rounded-3xl bg-white/70 backdrop-blur px-4 py-3 text-sm text-slate-600 shadow-sm ring-1 ring-black/5">
                <span>🌅 Lever : {weather.riseSet.sunrise ?? "—"}</span>
                <span>🌇 Coucher : {weather.riseSet.sunset ?? "—"}</span>
              </div>
            )}
            <HourlyStrip hours={weather.hourly} />
            <ForecastList periods={weather.daily} />
            <p className="px-2 text-center text-xs text-slate-400">
              Source : Environnement et Changement climatique Canada. « Chance de soleil » = 100 % −
              probabilité de précipitation officielle. Les alertes météo sont affichées sans
              modification.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
