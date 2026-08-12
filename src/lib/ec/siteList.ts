import type { EcSite } from "./types";
import { asArray, fetchText, nodeAttr, nodeText, parseXml } from "./xml";

const SITE_LIST_URL = "https://dd.weather.gc.ca/citypage_weather/xml/siteList.xml";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // la liste des stations change rarement

let cache: { sites: EcSite[]; fetchedAt: number } | null = null;

/** Convertit une latitude/longitude EC ("45.47N", "73.74W" ou "45.47") en nombre signé. */
function parseCoordinate(raw: string | null, negativeSuffix: string): number | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  const suffix = trimmed.slice(-1).toUpperCase();
  const numeric = Number.parseFloat(trimmed.replace(/[NSEW]$/i, ""));
  if (Number.isNaN(numeric)) return null;
  return suffix === negativeSuffix.toUpperCase() ? -Math.abs(numeric) : numeric;
}

function parseSiteListXml(xml: string): EcSite[] {
  const root = parseXml(xml) as Record<string, unknown>;
  const siteList = (root.siteList ?? root) as Record<string, unknown>;
  const sites = asArray(siteList.site);

  return sites
    .map((raw): EcSite | null => {
      const site = raw as Record<string, unknown>;
      const code = nodeAttr(site, "code") ?? nodeText(site.code);
      const province = nodeText(site.provinceCode) ?? nodeAttr(site, "provinceCode");
      const nameEn = nodeText(site.nameEn);
      const nameFr = nodeText(site.nameFr);
      const lat = parseCoordinate(nodeText(site.latitude), "S");
      const lon = parseCoordinate(nodeText(site.longitude), "W");

      if (!code || !province || !nameEn || lat === null || lon === null) return null;

      return {
        code,
        province: province.toUpperCase(),
        nameEn,
        nameFr: nameFr ?? nameEn,
        latitude: lat,
        longitude: lon,
      };
    })
    .filter((s): s is EcSite => s !== null);
}

export async function getSiteList(): Promise<EcSite[]> {
  const now = Date.now();
  if (cache && now - cache.fetchedAt < CACHE_TTL_MS) {
    return cache.sites;
  }

  const xml = await fetchText(SITE_LIST_URL);
  const sites = parseSiteListXml(xml);

  if (sites.length === 0) {
    throw new Error("La liste des stations d'Environnement Canada est vide ou n'a pas pu être lue.");
  }

  cache = { sites, fetchedAt: now };
  return sites;
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, ""); // enlève les accents
}

export async function searchSites(query: string, limit = 8): Promise<EcSite[]> {
  const q = normalize(query.trim());
  if (q.length < 2) return [];

  const sites = await getSiteList();
  const scored = sites
    .map((site) => {
      const fr = normalize(site.nameFr);
      const en = normalize(site.nameEn);
      let score = -1;
      if (fr === q || en === q) score = 100;
      else if (fr.startsWith(q) || en.startsWith(q)) score = 80;
      else if (fr.includes(q) || en.includes(q)) score = 50;
      return { site, score };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score || a.site.nameFr.localeCompare(b.site.nameFr));

  return scored.slice(0, limit).map((s) => s.site);
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export async function findNearestSite(latitude: number, longitude: number): Promise<EcSite | null> {
  const sites = await getSiteList();
  if (sites.length === 0) return null;

  let nearest = sites[0];
  let nearestDist = haversineKm(latitude, longitude, nearest.latitude, nearest.longitude);

  for (const site of sites.slice(1)) {
    const dist = haversineKm(latitude, longitude, site.latitude, site.longitude);
    if (dist < nearestDist) {
      nearest = site;
      nearestDist = dist;
    }
  }

  return nearest;
}
