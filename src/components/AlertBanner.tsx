import type { WeatherAlert } from "@/lib/ec/types";

/**
 * Les alertes officielles (veilles/avertissements) sont affichées telles
 * quelles, sans reformulation positive : la sécurité prime toujours sur le
 * cadrage optimiste du reste de l'application.
 */
export default function AlertBanner({ alerts }: { alerts: WeatherAlert[] }) {
  if (alerts.length === 0) return null;

  return (
    <div className="space-y-2">
      {alerts.map((a, i) => (
        <div
          key={i}
          className="flex items-start gap-3 rounded-2xl bg-rose-100 px-4 py-3 text-rose-900 ring-1 ring-rose-300"
        >
          <span className="text-xl" aria-hidden>
            ⚠️
          </span>
          <div className="text-sm">
            <p className="font-semibold uppercase tracking-wide">{a.type}</p>
            <p>{a.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
