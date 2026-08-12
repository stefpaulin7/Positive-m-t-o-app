import type { ForecastPeriod } from "@/lib/ec/types";
import { conditionToEmoji, iconCodeToEmoji } from "@/lib/ec/emoji";
import { formatTemp, sunshineColorClasses } from "@/lib/format";

export default function ForecastList({ periods }: { periods: ForecastPeriod[] }) {
  if (periods.length === 0) return null;

  return (
    <div className="rounded-3xl bg-white/70 backdrop-blur p-4 shadow-sm ring-1 ring-black/5">
      <h2 className="px-2 pb-2 text-sm font-semibold text-slate-500">Prévisions</h2>
      <ul className="divide-y divide-slate-200/70">
        {periods.map((p) => {
          const emoji = p.condition
            ? conditionToEmoji(p.condition, p.isNight)
            : iconCodeToEmoji(p.iconCode, p.isNight);
          const colors = sunshineColorClasses(p.sunshineChancePct);

          return (
            <li key={p.periodName} className="flex flex-col gap-1.5 px-2 py-3">
              <div className="flex items-center justify-between gap-2">
                <span className="flex min-w-0 items-center gap-2 font-medium text-slate-700">
                  <span className="text-xl shrink-0" aria-hidden>
                    {emoji}
                  </span>
                  <span className="truncate">{p.periodName}</span>
                </span>
                <span className="shrink-0 text-sm font-semibold text-slate-700">
                  {p.tempHighC !== null ? formatTemp(p.tempHighC) : formatTemp(p.tempLowC)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="min-w-0 flex-1 truncate text-sm text-slate-500">
                  {p.condition ?? p.textSummary}
                </span>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${colors.badge}`}
                  title="Chance de soleil / temps sec"
                >
                  ☀️ {p.sunshineChancePct}%
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
