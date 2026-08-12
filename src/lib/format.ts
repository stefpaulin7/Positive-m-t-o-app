/** Formats utilitaires d'affichage côté client. */

/** Parse un timestamp EC du style "20260812T190000Z" (ISO sans séparateurs). */
export function parseEcUtcTimestamp(raw: string): Date | null {
  const match = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z?$/.exec(raw.trim());
  if (!match) {
    const fallback = new Date(raw);
    return Number.isNaN(fallback.getTime()) ? null : fallback;
  }
  const [, y, mo, d, h, mi, s] = match;
  const iso = `${y}-${mo}-${d}T${h}:${mi}:${s}Z`;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatHour(date: Date): string {
  return new Intl.DateTimeFormat("fr-CA", { hour: "numeric" }).format(date);
}

export function formatTemp(value: number | null): string {
  if (value === null) return "—";
  return `${Math.round(value)}°`;
}

/** Couleurs Tailwind associées au niveau de chance de soleil (verre à moitié plein). */
export function sunshineColorClasses(pct: number): { badge: string; text: string } {
  if (pct >= 70) return { badge: "bg-amber-400/90 text-amber-950", text: "text-amber-600" };
  if (pct >= 45) return { badge: "bg-sky-300/90 text-sky-950", text: "text-sky-600" };
  return { badge: "bg-slate-300/90 text-slate-800", text: "text-slate-500" };
}
