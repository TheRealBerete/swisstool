/** Formes brutes exactement telles que documentées dans
 * allmediasaver-api-doc.md — jamais utilisées en dehors de rapidapi.ts /
 * vidssave.ts et de normalize.ts, qui les convertissent en `MediaInfo`
 * (types.ts) pour le reste de l'app. */

// ---- RapidAPI (social-download-all-in-one) ----

export interface RapidApiMedia {
  type: "video" | "audio" | "photo";
  /** Instagram/TikTok/Facebook : "1080x1350p", "hd_no_watermark", "HD"... */
  quality?: string;
  /** YouTube uniquement : "mp4 (360p)". */
  label?: string;
  /** Instagram/TikTok/Facebook/X. */
  extension?: string;
  /** YouTube uniquement — même rôle que `extension`, nom de champ différent. */
  ext?: string;
  width?: number;
  height?: number;
  /** TikTok uniquement. */
  data_size?: number;
  formatId?: number;
  url: string;
}

export interface RapidApiMediaResponse {
  error: boolean;
  message?: string;
  url?: string;
  source: string;
  title?: string;
  author?: string;
  thumbnail?: string;
  /** Secondes (YouTube, TikTok) OU millisecondes (observé sur Facebook) —
   * voir normalize.ts pour l'heuristique de correction. */
  duration?: number;
  medias?: RapidApiMedia[];
  type?: "single" | "multiple";
}

// ---- VidsSave (YouTube uniquement) ----

export interface VidsSaveResource {
  resource_id: string;
  /** "360P", "144P"... ou "48kbps"/"128kbps"/"256kbps" pour l'audio. */
  quality: string;
  format: string;
  type: "video" | "audio";
  size: number;
  /** Jeton opaque à renvoyer tel quel à l'étape 2 (download). */
  resource_content: string;
}

export interface VidsSaveParseData {
  title: string;
  thumbnail: string;
  /** Secondes — fiable, contrairement à RapidAPI (vérifié doc §10.3). */
  duration: number;
  resources: VidsSaveResource[];
}

export interface VidsSseSuccessPayload {
  status: "success" | "error";
  progress?: number;
  filesize?: number;
  download_link?: string;
}
