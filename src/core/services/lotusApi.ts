import { toast } from "@/core/store/useToastStore";
import type { LotusDownloadResult, LotusVideoInfo } from "@/lib/lotus/types";

/**
 * Service client du module Téléchargeur — appelle nos propres routes
 * /api/lotus/* (jamais directement api.lotusvids.online, voir
 * src/lib/lotus/client.ts pour le pourquoi). Même convention que
 * filesApi.ts/clipboardApi.ts : retourne `null` + toast d'erreur plutôt que
 * de lever une exception, pour que les composants n'aient pas de try/catch
 * à gérer.
 */
export async function fetchVideoInfo(url: string): Promise<LotusVideoInfo | null> {
  const res = await fetch(`/api/lotus/info?url=${encodeURIComponent(url)}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    toast.error(data.error ?? "Impossible de lire ce lien");
    return null;
  }
  return data as LotusVideoInfo;
}

export async function requestDownload(
  url: string,
  formatId: string
): Promise<LotusDownloadResult | null> {
  const res = await fetch("/api/lotus/download", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url, formatId }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    toast.error(data.error ?? "Échec du téléchargement");
    return null;
  }
  return data as LotusDownloadResult;
}

/** URL same-origin pour lire les octets d'un lien Lotus en JS (fetch/Blob).
 * Le lien R2 direct ne le permet pas (CORS, voir route.ts) — seule la
 * balise <video> peut le lire tel quel. */
export function buildStreamUrl(remoteUrl: string): string {
  return `/api/lotus/stream?url=${encodeURIComponent(remoteUrl)}`;
}

/** Récupère les octets d'un résultat Lotus sous forme de File, prêt pour
 * `navigator.share({ files: [...] })`. Retourne `null` + toast en cas
 * d'échec (lien expiré côté R2, réseau, etc.). */
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
