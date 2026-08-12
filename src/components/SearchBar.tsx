"use client";

import { useEffect, useRef, useState } from "react";
import type { EcSite } from "@/lib/ec/types";

interface Props {
  onSelect: (site: EcSite) => void;
  onUseLocation: () => void;
  locating: boolean;
  locationError: string | null;
  currentCityName?: string;
}

export default function SearchBar({
  onSelect,
  onUseLocation,
  locating,
  locationError,
  currentCityName,
}: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<EcSite[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const trimmed = query.trim();
    if (trimmed.length < 2) return;

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/sites?q=${encodeURIComponent(trimmed)}`);
        const data = await res.json();
        setResults(data.sites ?? []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const open = query.trim().length >= 2 && results.length > 0;

  return (
    <div className="relative w-full">
      <div className="flex items-center gap-2 rounded-2xl bg-white/80 backdrop-blur px-4 py-3 shadow-sm ring-1 ring-black/5">
        <span aria-hidden>🔎</span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={
            currentCityName
              ? `Chercher une autre ville (actuellement ${currentCityName})`
              : "Rechercher une ville (ex. Montréal, Québec, Gatineau)"
          }
          className="w-full bg-transparent outline-none placeholder:text-slate-400 text-slate-800"
          aria-label="Rechercher une ville"
        />
        {loading && <span className="text-xs text-slate-400">…</span>}
      </div>

      {open && results.length > 0 && (
        <ul className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-black/5">
          {results.map((site) => (
            <li key={`${site.province}-${site.code}`}>
              <button
                type="button"
                onClick={() => {
                  onSelect(site);
                  setResults([]);
                  setQuery("");
                }}
                className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-amber-50"
              >
                <span className="text-slate-800">{site.nameFr}</span>
                <span className="text-xs uppercase text-slate-400">{site.province}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={onUseLocation}
        disabled={locating}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-500 px-4 py-3 font-medium text-white shadow-sm transition active:scale-[0.99] disabled:opacity-60"
      >
        <span aria-hidden>📍</span>
        {locating ? "Localisation en cours…" : "Utiliser ma position"}
      </button>
      {locationError && <p className="mt-2 text-sm text-rose-600">{locationError}</p>}
    </div>
  );
}
