// Pas de package "server-only" installé dans ce projet — ce module n'est de
// toute façon importé que depuis src/app/api/lotus/*/route.ts (jamais un
// composant client), donc rien ne peut l'embarquer dans le bundle navigateur.
import type { LotusDownloadResult, LotusVideoInfo } from "./types";

const LOTUS_BASE_URL = process.env.LOTUS_API_BASE_URL ?? "https://api.lotusvids.online";

/** Erreur typée pour propager le code HTTP + le message d'origine de
 * l'API Lotus jusqu'à notre route handler, qui les retransmet tels quels
 * au client (mêmes codes que documentés : 400/401/403/502). */
export class LotusApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function readJson(res: Response): Promise<Record<string, unknown>> {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

/**
 * Le token Lotus expire en 180s (voir doc §1) — plutôt que de le mettre en
 * cache et gérer son renouvellement, on en redemande un neuf à chaque appel
 * `info`/`download`. Ce module est appelé une poignée de fois par usage
 * (usage personnel), le coût d'un aller-retour réseau en plus est
 * négligeable face à la complexité d'un cache à durée de vie aussi courte.
 */
async function getToken(): Promise<string> {
  const res = await fetch(`${LOTUS_BASE_URL}/api/get-token`, {
    method: "POST",
    cache: "no-store",
  });
  if (!res.ok) {
    throw new LotusApiError("Service de téléchargement indisponible", 502);
  }
  const data = await readJson(res);
  const token = data.token;
  if (typeof token !== "string") {
    throw new LotusApiError("Service de téléchargement indisponible", 502);
  }
  return token;
}

async function lotusFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = await getToken();
  return fetch(`${LOTUS_BASE_URL}${path}`, {
    ...init,
    headers: { ...(init.headers ?? {}), Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
}

export async function fetchVideoInfo(url: string): Promise<LotusVideoInfo> {
  const params = new URLSearchParams({ url });
  const res = await lotusFetch(`/api/info?${params.toString()}`);
  const data = await readJson(res);
  if (!res.ok) {
    throw new LotusApiError(
      typeof data.error === "string" ? data.error : "Impossible de lire ce lien",
      res.status
    );
  }
  return data as unknown as LotusVideoInfo;
}

export async function requestDownload(
  url: string,
  formatId: string
): Promise<LotusDownloadResult> {
  const res = await lotusFetch(`/api/download`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url, formatId }),
  });
  const data = await readJson(res);
  if (!res.ok) {
    throw new LotusApiError(
      typeof data.error === "string" ? data.error : "Échec du téléchargement",
      res.status
    );
  }
  return data as unknown as LotusDownloadResult;
}
