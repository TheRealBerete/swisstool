import { NextResponse, type NextRequest } from "next/server";
import { DownloaderApiError } from "@/lib/media-downloader/errors";
import { resolveResource } from "@/lib/media-downloader/vidssave";

/** Résolution "paresseuse" d'un format VidsSave (YouTube) — voir
 * MediaFormat.resolveToken dans lib/media-downloader/types.ts. Les formats
 * RapidAPI n'appellent jamais cette route : leur URL est déjà connue dès
 * /api/downloader/info. */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const resolveToken = typeof body?.resolveToken === "string" ? body.resolveToken : null;
  if (!resolveToken) {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  try {
    const { url, size } = await resolveResource(resolveToken);
    return NextResponse.json({ url, size });
  } catch (err) {
    if (err instanceof DownloaderApiError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Erreur inconnue" }, { status: 500 });
  }
}

// La résolution VidsSave attend un flux SSE de durée variable (voir
// vidssave.ts, coupé à 45s côté client HTTP) — la limite par défaut de la
// fonction serverless (10s sur le plan Vercel Hobby) serait trop courte.
// À ajuster/vérifier selon le plan Vercel réellement utilisé.
export const maxDuration = 60;
