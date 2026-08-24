import { NextResponse, type NextRequest } from "next/server";
import { DownloaderApiError } from "@/lib/media-downloader/errors";
import { normalizeRapidApi } from "@/lib/media-downloader/normalize";
import { fetchAutolink } from "@/lib/media-downloader/rapidapi";

/**
 * Route tout — YouTube compris — vers RapidAPI (Instagram/TikTok/
 * Facebook/X/YouTube). VidsSave (voir lib/media-downloader/vidssave.ts,
 * toujours implémenté mais plus appelé ici) devait gérer YouTube
 * spécifiquement, mais son API bloque les IP sortantes de Vercel au
 * niveau réseau — confirmé le 24/08/2026 : un `fetch()` identique
 * (mêmes en-têtes) réussit depuis un poste de dev mais échoue
 * systématiquement une fois déployé, aucun fix côté code ne peut
 * contourner ça depuis l'intérieur d'une fonction Vercel. RapidAPI
 * fonctionne pour toutes les plateformes déjà testées en prod ; sa
 * fiabilité sur YouTube spécifiquement est documentée comme incohérente
 * (allmediasaver-api-doc.md §7) mais reste préférable à un YouTube
 * totalement cassé.
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "URL invalide" }, { status: 400 });
  }

  try {
    const info = normalizeRapidApi(await fetchAutolink(url));

    if (info.formats.length === 0) {
      return NextResponse.json({ error: "Aucun média téléchargeable trouvé sur ce lien" }, { status: 404 });
    }
    return NextResponse.json(info);
  } catch (err) {
    if (err instanceof DownloaderApiError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Erreur inconnue" }, { status: 500 });
  }
}

// Cette route n'attend normalement que quelques centaines de ms (un seul
// appel RapidAPI), mais un appel réseau externe peut parfois traîner —
// mieux vaut une marge que le timeout par défaut du plan Vercel (502
// générique sans message exploitable).
export const maxDuration = 30;
