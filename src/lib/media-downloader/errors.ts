/** Erreur typée pour propager un code HTTP + un message lisible jusqu'à nos
 * route handlers, qui les retransmettent tels quels au client. Remplace
 * `LotusApiError` (même rôle) — un seul type d'erreur pour les deux
 * providers (RapidAPI, VidsSave) évite de dupliquer la gestion d'erreur
 * dans chaque route. */
export class DownloaderApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function readJson(res: Response): Promise<Record<string, unknown>> {
  try {
    return await res.json();
  } catch {
    return {};
  }
}
