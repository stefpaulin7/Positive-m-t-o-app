/**
 * Choix de l'emoji météo à partir du texte de condition fourni par
 * Environnement Canada (en français). On se base sur des mots-clés plutôt
 * que sur les codes numériques d'icônes (0-44) d'EC, dont la table exacte
 * varie selon les documents et est moins fiable à reproduire de mémoire
 * qu'une correspondance texte, elle-même déjà en français dans le flux XML
 * `_f.xml` qu'on interroge.
 */
export function conditionToEmoji(
  conditionText: string | null | undefined,
  isNight: boolean
): string {
  const text = (conditionText ?? "").toLowerCase();

  const has = (...keywords: string[]) => keywords.some((k) => text.includes(k));

  if (has("orage", "orageu")) return "⛈️";
  if (has("tornade")) return "🌪️";
  if (has("grêle", "grele")) return "🌨️";
  if (has("verglas", "glace")) return "🧊";
  if (has("poudrerie", "rafales de neige", "neige soufflée")) return "🌬️❄️";
  if (has("neige", "flurries", "flocons")) return "🌨️";
  if (has("averses", "pluie", "bruine", "précipitation")) return "🌧️";
  if (has("brouillard", "brume")) return "🌫️";
  if (has("fumée")) return "🌫️";
  if (has("venteux", "vent fort", "rafales")) return "💨";
  if (has("dégagé", "degage", "clair") && isNight) return "🌙";
  if (has("ensoleillé", "ensoleille", "soleil") && !isNight) return "☀️";
  if (has("ensoleillé", "ensoleille", "soleil") && isNight) return "🌙";

  if (has("généralement nuageux", "surtout nuageux", "nuageux")) {
    return isNight ? "☁️" : "☁️";
  }
  if (has("passages nuageux", "partiellement nuageux", "quelques nuages", "mêlé", "mele")) {
    return isNight ? "🌤️" : "⛅";
  }
  if (has("nuage")) return isNight ? "☁️" : "⛅";

  // Repli neutre selon jour/nuit lorsque le texte n'a rien matché.
  return isNight ? "🌙" : "🌤️";
}

/** Repli basé sur le code d'icône EC quand aucun texte n'est disponible. */
export function iconCodeToEmoji(iconCode: string | null | undefined, isNight: boolean): string {
  const code = Number.parseInt(iconCode ?? "", 10);
  if (Number.isNaN(code)) return isNight ? "🌙" : "🌤️";

  if (code === 0 || code === 1) return isNight ? "🌙" : "☀️";
  if (code === 2 || code === 3) return isNight ? "🌤️" : "⛅";
  if (code === 4) return "☁️";
  if (code >= 5 && code <= 9) return "🌧️";
  if (code >= 10 && code <= 12) return "🌦️";
  if (code >= 13 && code <= 19) return "🌫️";
  if (code >= 20 && code <= 29) return "🌨️";
  if (code >= 30 && code <= 36) return isNight ? "🌙" : "☀️";
  if (code >= 37 && code <= 39) return "⛈️";
  if (code >= 40 && code <= 44) return "❄️";
  return isNight ? "🌙" : "🌤️";
}
