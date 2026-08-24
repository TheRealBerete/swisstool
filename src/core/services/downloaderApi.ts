import { toast } from "@/core/store/useToastStore";
import type { MediaInfo } from "@/lib/media-downloader/types";

/**
 * Service client du module Téléchargeur — appelle nos propres routes
 * /api/downloader/* (jamais directement RapidAPI/VidsSave, voir
 * src/lib/media-downloader/ pour le pourquoi : clé RapidAPI et jetons
 * VidsSave restent entièrement côté serveur). Même convention que
 * filesApi.ts/clipboardApi.ts : retourne `null` + toast d'erreur plutôt
 * que de lever une exception, pour que les composants n'aient pas de
 * try/catch à gérer.
 */
export async function fetchMediaInfo(url: string): Promise<MediaInfo | null> {
  const res = await fetch(`/api/downloader/info?url=${encodeURIComponent(url)}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    toast.error(data.error ?? "Impossible de lire ce lien");
    return null;
  }
  return data as MediaInfo;
}

/** Résolution "paresseuse" d'un format VidsSave (YouTube) — voir
 * MediaFormat.resolveToken. Peut prendre plusieurs secondes (attente SSE
 * côté serveur), d'où le statut "downloading" réutilisé pour ça côté UI. */
export async function resolveFormatUrl(
  resolveToken: string
): Promise<{ url: string; size: number | null } | null> {
  const res = await fetch("/api/downloader/resolve", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ resolveToken }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    toast.error(data.error ?? "Échec de la préparation du fichier");
    return null;
  }
  return data as { url: string; size: number | null };
}

/** URL same-origin pour lire les octets d'un lien média en JS (fetch/Blob).
 * Le lien direct ne le permet pas (CORS, voir stream/route.ts) — seule une
 * balise <video>/<img> peut le lire tel quel. */
export function buildStreamUrl(remoteUrl: string): string {
  return `/api/downloader/stream?url=${encodeURIComponent(remoteUrl)}`;
}

/** Récupère les octets d'un résultat sous forme de File, prêt pour
 * `navigator.share({ files: [...] })`. Retourne `null` + toast en cas
 * d'échec (lien expiré, réseau, etc.). */
export async function fetchAsFile(
  remoteUrl: string,
  filename: string,
  mimeType: string
): Promise<File | null> {
  const res = await fetch(buildStreamUrl(remoteUrl));
  if (!res.ok) {
    toast.error("Lien expiré ou inaccessible — régénère-le");
    return null;
  }
  const blob = await res.blob();
  return new File([blob], filename, { type: blob.type || mimeType });
}
