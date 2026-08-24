import { NextResponse, type NextRequest } from "next/server";
import { DownloaderApiError } from "@/lib/media-downloader/errors";
import { isYoutubeUrl, normalizeRapidApi, normalizeVidsSave } from "@/lib/media-downloader/normalize";
import { fetchAutolink } from "@/lib/media-downloader/rapidapi";
import { parseYoutube } from "@/lib/media-downloader/vidssave";

/**
 * Détecte la plateforme via le domaine de l'URL et route vers le bon
 * provider (doc §10.1 : VidsSave pour YouTube, plus fiable que RapidAPI
 * sur cette plateforme spécifique ; RapidAPI pour tout le reste). Le
 * client ne voit jamais cette distinction, seulement la forme unifiée
 * `MediaInfo` (voir normalize.ts).
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "URL invalide" }, { status: 400 });
  }

  try {
    const info = isYoutubeUrl(url)
      ? normalizeVidsSave(await parseYoutube(url))
      : normalizeRapidApi(await fetchAutolink(url));

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

// Cette route n'attend normalement que quelques centaines de ms (étape 1
// VidsSave ou appel unique RapidAPI), mais un appel réseau externe peut
// parfois traîner — mieux vaut une marge que le timeout par défaut du
// plan Vercel (502 générique sans message exploitable, voir vidssave.ts).
export const maxDuration = 30;
