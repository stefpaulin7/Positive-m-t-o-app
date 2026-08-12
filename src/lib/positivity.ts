/**
 * Coeur du concept "positif" de l'application : Environnement Canada exprime
 * ses prévisions en probabilité de PRÉCIPITATION ("pop", "chance of
 * precipitation"). On la retourne en probabilité de SOLEIL/temps sec, mise
 * de l'avant dans l'interface à la place du pourcentage de pluie.
 *
 * On ne touche PAS aux alertes météo (veilles/avertissements) : la sécurité
 * prime toujours sur le cadrage positif.
 */
export function popToSunshineChance(pop: number | null): number {
  if (pop === null || Number.isNaN(pop)) return 100;
  const clamped = Math.min(100, Math.max(0, pop));
  return Math.round(100 - clamped);
}

export function sunshineLabel(sunshineChancePct: number): string {
  if (sunshineChancePct >= 90) return "Journée radieuse";
  if (sunshineChancePct >= 70) return "Belles éclaircies";
  if (sunshineChancePct >= 50) return "Bon potentiel de soleil";
  if (sunshineChancePct >= 30) return "Éclaircies possibles";
  return "Le soleil jouera à cache-cache";
}
