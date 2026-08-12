import { NextRequest, NextResponse } from "next/server";
import { findNearestSite, searchSites } from "@/lib/ec/siteList";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");
  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");

  try {
    if (lat && lon) {
      const site = await findNearestSite(Number.parseFloat(lat), Number.parseFloat(lon));
      if (!site) {
        return NextResponse.json({ error: "Aucune station trouvée près de vous." }, { status: 404 });
      }
      return NextResponse.json({ sites: [site] });
    }

    if (!q) {
      return NextResponse.json({ error: "Paramètre 'q' ou 'lat'/'lon' requis." }, { status: 400 });
    }

    const sites = await searchSites(q);
    return NextResponse.json({ sites });
  } catch (err) {
    console.error("Erreur /api/sites", err);
    return NextResponse.json(
      { error: "Impossible de récupérer les données d'Environnement Canada pour le moment." },
      { status: 502 }
    );
  }
}
