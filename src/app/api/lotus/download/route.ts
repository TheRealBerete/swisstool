import { NextResponse, type NextRequest } from "next/server";
import { LotusApiError, requestDownload } from "@/lib/lotus/client";

/** Proxy serveur vers `POST /api/download` de Lotus — même raisonnement
 * que route.ts du dossier voisin (info) : le token éphémère reste
 * entièrement côté serveur. */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const url = typeof body?.url === "string" ? body.url : null;
  const formatId = typeof body?.formatId === "string" ? body.formatId : null;

  if (!url || !formatId) {
    return NextResponse.json({ error: "URL invalide" }, { status: 400 });
  }

  try {
    const result = await requestDownload(url, formatId);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof LotusApiError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Erreur inconnue" }, { status: 500 });
  }
}
