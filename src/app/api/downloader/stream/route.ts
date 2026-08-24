import { NextResponse, type NextRequest } from "next/server";
import { assertPublicHttpsUrl } from "@/lib/media-downloader/ssrf";

/**
 * Relaie les octets d'un lien de média déjà obtenu (via
 * /api/downloader/info ou /resolve) — nécessaire UNIQUEMENT pour le
 * bouton "Enregistrer dans Photos" (fetch() + Web Share API avec
 * fichier), qui doit lire la réponse en JS. Contrairement à une balise
 * <video>/<img> (qui charge le lien distant nativement, sans passer par
 * ici — CORS ne s'applique pas au chargement natif d'un média), un
 * fetch() JS EST soumis à CORS, et aucun des CDN utilisés ici (Instagram,
 * TikTok, VidsSave...) n'envoie d'en-tête Access-Control-Allow-Origin.
 * Ce proxy fait le fetch côté serveur (pas soumis à CORS) et relaie le
 * flux tel quel, sans le charger entièrement en mémoire.
 */
export async function GET(request: NextRequest) {
  const target = request.nextUrl.searchParams.get("url");
  if (!target) {
    return NextResponse.json({ error: "URL manquante" }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = await assertPublicHttpsUrl(target);
  } catch {
    return NextResponse.json({ error: "Domaine non autorisé" }, { status: 400 });
  }

  const range = request.headers.get("range");
  const upstream = await fetch(parsed.toString(), {
    headers: range ? { Range: range } : undefined,
    // Une redirection pourrait pointer vers une IP interne non revérifiée
    // par assertPublicHttpsUrl — on la refuse plutôt que de la suivre à
    // l'aveugle (voir ssrf.ts). Les URLs qu'on relaie ici sont déjà les
    // liens finaux (VidsSave/RapidAPI), aucune redirection n'est attendue
    // en usage normal.
    redirect: "manual",
    cache: "no-store",
  });

  if (upstream.status >= 300 && upstream.status < 400) {
    return NextResponse.json({ error: "Redirection inattendue" }, { status: 502 });
  }
  if (!upstream.ok && upstream.status !== 206) {
    return NextResponse.json({ error: "Fichier introuvable ou expiré" }, { status: 502 });
  }

  const headers = new Headers();
  for (const key of ["content-type", "content-length", "content-range", "accept-ranges", "etag"]) {
    const value = upstream.headers.get(key);
    if (value) headers.set(key, value);
  }

  return new Response(upstream.body, { status: upstream.status, headers });
}

// Le flux reste ouvert le temps de relayer tout le fichier (peut dépasser
// le timeout serverless par défaut sur une vidéo un peu longue) — la
// fonction reste "active" pendant tout le streaming, pas juste le premier
// octet.
export const maxDuration = 60;
