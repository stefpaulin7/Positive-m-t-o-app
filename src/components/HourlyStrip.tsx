import type { HourlyForecastEntry } from "@/lib/ec/types";
import { conditionToEmoji, iconCodeToEmoji } from "@/lib/ec/emoji";
import { formatHour, formatTemp, parseEcUtcTimestamp } from "@/lib/format";

export default function HourlyStrip({ hours }: { hours: HourlyForecastEntry[] }) {
  if (hours.length === 0) return null;

  return (
    <div className="rounded-3xl bg-white/70 backdrop-blur p-4 shadow-sm ring-1 ring-black/5">
      <h2 className="px-2 pb-2 text-sm font-semibold text-slate-500">Heure par heure</h2>
      <div className="flex gap-4 overflow-x-auto px-2 pb-1">
        {hours.slice(0, 24).map((h) => {
          const date = parseEcUtcTimestamp(h.timeUTC);
          const emoji = h.condition ? conditionToEmoji(h.condition, false) : iconCodeToEmoji(h.iconCode, false);
          return (
            <div key={h.timeUTC} className="flex shrink-0 flex-col items-center gap-1 text-center">
              <span className="text-xs text-slate-400">{date ? formatHour(date) : "—"}</span>
              <span className="text-2xl" aria-hidden>
                {emoji}
              </span>
              <span className="text-sm font-medium text-slate-700">{formatTemp(h.temperatureC)}</span>
              <span className="text-[11px] font-semibold text-amber-600">☀️{h.sunshineChancePct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
