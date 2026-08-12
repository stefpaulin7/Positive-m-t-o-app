import { NextRequest, NextResponse } from "next/server";
import { getWeatherForSite } from "@/lib/ec/weather";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const province = searchParams.get("province");
  const code = searchParams.get("code");

  if (!province || !code) {
    return NextResponse.json({ error: "Paramètres 'province' et 'code' requis." }, { status: 400 });
  }

  try {
    const data = await getWeatherForSite(province, code);
    return NextResponse.json(data);
  } catch (err) {
    console.error("Erreur /api/weather", err);
    return NextResponse.json(
      { error: "Impossible de récupérer les données météo d'Environnement Canada pour le moment." },
      { status: 502 }
    );
  }
}
