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
