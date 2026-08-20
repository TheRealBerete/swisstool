/** Reflète les types de réponse de l'API Lotus Vids (voir lotus-documentation.md).
 * Partagé entre le client serveur (`lib/lotus/client.ts`, appelle l'API
 * externe) et le service client (`core/services/lotusApi.ts`, appelle nos
 * propres routes /api/lotus/*) pour ne pas dupliquer la forme des données. */
export interface LotusFormat {
  format_id: string;
  ext: string;
  /** "audio" pour les pistes sans vidéo, sinon "144p"…"2160p". */
  resolution: string;
  height: number;
  fps: number | null;
  vcodec: string;
  acodec: string;
  filesize: number;
}

export interface LotusVideoInfo {
  title: string;
  thumbnail: string;
  /** Secondes. */
  duration: number;
  platform: string;
  formats: LotusFormat[];
}

export interface LotusDownloadResult {
  /** Lien signé Cloudflare R2, direct et temporaire. */
  url: string;
  filename: string;
}
