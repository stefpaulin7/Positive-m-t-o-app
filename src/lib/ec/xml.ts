import { XMLParser } from "fast-xml-parser";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  textNodeName: "#text",
  parseAttributeValue: false,
  trimValues: true,
});

export function parseXml(xml: string): unknown {
  return parser.parse(xml);
}

/** Normalise un noeud fast-xml-parser (objet unique ou tableau) en tableau. */
export function asArray<T>(value: T | T[] | undefined | null): T[] {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}

/** Lit le texte d'un noeud qui peut être une string, {#text}, ou absent. */
export function nodeText(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value === "string") return value.trim() || null;
  if (typeof value === "number") return String(value);
  if (typeof value === "object" && value !== null) {
    const obj = value as Record<string, unknown>;
    if ("#text" in obj) {
      const t = obj["#text"];
      return typeof t === "string" ? t.trim() || null : t != null ? String(t) : null;
    }
    // Certains noeuds (ex: <dateTime>) enveloppent le texte lisible dans un
    // enfant <textSummary> plutôt que d'avoir du texte direct.
    if ("textSummary" in obj) return nodeText(obj.textSummary);
  }
  return null;
}

export function nodeAttr(value: unknown, attr: string): string | null {
  if (typeof value !== "object" || value === null) return null;
  const v = (value as Record<string, unknown>)[`@_${attr}`];
  return typeof v === "string" ? v : v != null ? String(v) : null;
}

export function toFloat(value: unknown): number | null {
  const text = nodeText(value);
  if (text === null) return null;
  const n = Number.parseFloat(text.replace(",", "."));
  return Number.isNaN(n) ? null : n;
}

export function toInt(value: unknown): number | null {
  const text = nodeText(value);
  if (text === null) return null;
  const n = Number.parseInt(text, 10);
  return Number.isNaN(n) ? null : n;
}

const USER_AGENT = "PositiveMeteoApp/1.0 (+https://github.com/stefpaulin7/Positive-m-t-o-app)";

export async function fetchText(url: string, timeoutMs = 10_000): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": USER_AGENT, Accept: "application/xml,text/xml,*/*" },
      // Les fichiers Datamart d'Environnement Canada sont mis à jour environ
      // aux heures ; inutile de les considérer statiques pour toujours.
      cache: "no-store",
    });
    if (!res.ok) {
      throw new Error(`Environnement Canada a répondu ${res.status} pour ${url}`);
    }
    return await res.text();
  } finally {
    clearTimeout(timeout);
  }
}
