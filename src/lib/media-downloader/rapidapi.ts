// Pas de package "server-only" installé dans ce projet — ce module n'est de
// toute façon importé que depuis src/app/api/downloader/*/route.ts (jamais
// un composant client), donc rien ne peut l'embarquer dans le bundle
// navigateur.
import { DownloaderApiError, readJson } from "./errors";
import type { RapidApiMediaResponse } from "./raw-types";

const RAPIDAPI_HOST = process.env.RAPIDAPI_HOST ?? "social-download-all-in-one.p.rapidapi.com";

/**
 * Instagram, TikTok, Facebook, X/Twitter — tout sauf YouTube (voir
 * vidssave.ts). Un seul appel POST "autolink" : le provider détecte la
 * plateforme via le domaine de l'URL, pas besoin de le préciser.
 */
export async function fetchAutolink(url: string): Promise<RapidApiMediaResponse> {
  const key = process.env.RAPIDAPI_KEY;
  if (!key) {
    throw new DownloaderApiError("Service de téléchargement non configuré (clé RapidAPI manquante)", 500);
  }

  const res = await fetch(`https://${RAPIDAPI_HOST}/v1/social/autolink`, {
    method: "POST",
    headers: {
      "x-rapidapi-host": RAPIDAPI_HOST,
      "x-rapidapi-key": key,
      "content-type": "application/json",
    },
    body: JSON.stringify({ url }),
    cache: "no-store",
  });

  if (!res.ok) {
    // 429 = quota RapidAPI dépassé (doc §7) ; 401/403 = clé invalide.
    if (res.status === 429) {
      throw new DownloaderApiError("Quota de téléchargements atteint pour ce mois — réessaie plus tard", 429);
    }
    throw new DownloaderApiError("Service de téléchargement indisponible", 502);
  }

  const data = (await readJson(res)) as unknown as RapidApiMediaResponse;

  // ⚠️ Cette API renvoie TOUJOURS HTTP 200, même en erreur métier (URL non
  // supportée, post sans média...) — le vrai statut est dans `data.error`
  // (doc §5/§6). Se fier à `res.ok` seul laisserait passer ces cas comme
  // des succès.
  if (data.error) {
    const message = data.message ?? "Aucun média trouvé sur ce lien";
    // "Not found data" (tweet sans média) / "URL not supported" / etc. —
    // pas d'erreur serveur, une réponse fonctionnelle négative : 404 est
    // plus juste que 502 ici.
    throw new DownloaderApiError(message, 404);
  }

  return data;
}
