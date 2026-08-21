import { NextResponse, type NextRequest } from "next/server";

/**
 * Relaie les octets d'un lien de téléchargement Lotus déjà obtenu
 * (via /api/lotus/download) — nécessaire UNIQUEMENT pour le bouton
 * "Enregistrer dans Photos" (fetch() + Web Share API avec fichier), qui
 * doit lire la réponse en JS. Contrairement à la balise <video> (qui lit
 * le lien R2 directement, sans passer par ici — CORS ne s'applique pas à
 * un <video>), un fetch() JS EST soumis à CORS, et le bucket R2 de Lotus
 * n'envoie aucun en-tête Access-Control-Allow-Origin (vérifié). Ce proxy
 * fait le fetch côté serveur (pas soumis à CORS) et relaie le flux
 * tel quel, sans le charger entièrement en mémoire.
 */
const ALLOWED_HOST_SUFFIX = ".r2.dev";

export async function GET(request: NextRequest) {
  const target = request.nextUrl.searchParams.get("url");
  if (!target) {
    return NextResponse.json({ error: "URL manquante" }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(target);
  } catch {
    return NextResponse.json({ error: "URL invalide" }, { status: 400 });
  }

  // N'autorise que le domaine R2 utilisé par Lotus pour ses liens de
  // téléchargement — sinon cette route serait un proxy ouvert vers
  // n'importe quelle URL pour tout compte authentifié (SSRF).
  if (parsed.protocol !== "https:" || !parsed.hostname.endsWith(ALLOWED_HOST_SUFFIX)) {
    return NextResponse.json({ error: "Domaine non autorisé" }, { status: 400 });
  }

  const range = request.headers.get("range");
  const upstream = await fetch(parsed.toString(), {
    headers: range ? { Range: range } : undefined,
    cache: "no-store",
  });

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
