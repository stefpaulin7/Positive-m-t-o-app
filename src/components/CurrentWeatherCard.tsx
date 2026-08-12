import type { CurrentConditions, ForecastPeriod } from "@/lib/ec/types";
import { conditionToEmoji, iconCodeToEmoji } from "@/lib/ec/emoji";
import { sunshineLabel } from "@/lib/positivity";
import { formatTemp } from "@/lib/format";

interface Props {
  locationName: string;
  current: CurrentConditions;
  todayForecast: ForecastPeriod | null;
}

export default function CurrentWeatherCard({ locationName, current, todayForecast }: Props) {
  const emoji = current.condition
    ? conditionToEmoji(current.condition, false)
    : iconCodeToEmoji(current.iconCode, false);

  const sunshine = todayForecast?.sunshineChancePct ?? null;

  return (
    <div className="rounded-3xl bg-white/70 backdrop-blur p-6 shadow-sm ring-1 ring-black/5">
      <p className="text-sm font-medium text-slate-500">{locationName}</p>

      <div className="mt-2 flex items-center gap-4">
        <span className="animate-float-slow text-6xl" aria-hidden>
          {emoji}
        </span>
        <div>
          <p className="text-5xl font-semibold text-slate-800">{formatTemp(current.temperatureC)}</p>
          <p className="text-slate-500">{current.condition ?? "Conditions inconnues"}</p>
        </div>
      </div>

      {sunshine !== null && (
        <div className="mt-4 flex items-center gap-3 rounded-2xl bg-amber-100/80 px-4 py-3">
          <span className="text-2xl" aria-hidden>
            ☀️
          </span>
          <div>
            <p className="font-semibold text-amber-900">{sunshine}% de chance de soleil aujourd&apos;hui</p>
            <p className="text-sm text-amber-800/80">{sunshineLabel(sunshine)}</p>
          </div>
        </div>
      )}

      <div className="mt-5 grid grid-cols-3 gap-3 text-center text-sm">
        <Stat icon="🤔" label="Ressenti" value={formatTemp(current.feelsLikeC ?? current.temperatureC)} />
        <Stat icon="💧" label="Humidité" value={current.humidityPct !== null ? `${Math.round(current.humidityPct)}%` : "—"} />
        <Stat icon="💨" label="Vent" value={current.windSpeedKmh !== null ? `${Math.round(current.windSpeedKmh)} km/h` : "—"} />
        <Stat icon="👁️" label="Visibilité" value={current.visibilityKm !== null ? `${current.visibilityKm} km` : "—"} />
        <Stat icon="🧭" label="Direction" value={current.windDirection ?? "—"} />
        <Stat icon="🔆" label="Indice UV" value={current.uvIndex !== null ? String(current.uvIndex) : "—"} />
      </div>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/60 p-2">
      <div className="text-lg" aria-hidden>
        {icon}
      </div>
      <div className="font-medium text-slate-700">{value}</div>
      <div className="text-xs text-slate-400">{label}</div>
    </div>
  );
}
