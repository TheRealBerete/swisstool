/** Forme UNIFIÉE exposée par nos routes /api/downloader/* — indépendante du
 * provider réel qui a répondu (RapidAPI ou VidsSave, voir
 * allmediasaver-api-doc.md). Le front (src/modules/downloader) ne connaît
 * que ces types-là, jamais la forme brute d'un provider : ça permet de
 * changer/ajouter un provider plus tard sans toucher à l'UI. */
export interface MediaFormat {
  /** Identifiant stable côté UI (pas forcément celui du provider). */
  id: string;
  kind: "video" | "audio" | "photo";
  /** Libellé déjà prêt à afficher (ex: "1080x1350p", "hd_no_watermark", "360P"). */
  label: string;
  ext: string;
  width: number | null;
  height: number | null;
  /** Octets, quand le provider le donne à l'avance (VidsSave, TikTok via
   * `data_size`) — `null` sinon (RapidAPI ne le donne pas pour les autres
   * plateformes, on ne le connaît qu'une fois le fichier résolu). */
  size: number | null;
  /** URL de téléchargement directe — présente immédiatement pour RapidAPI.
   * `null` pour un format VidsSave tant qu'il n'a pas été résolu (voir
   * `resolveToken`). */
  url: string | null;
  /** Jeton opaque VidsSave (`resource_content`) à envoyer à
   * `POST /api/downloader/resolve` pour obtenir l'URL réelle — résolution
   * "paresseuse" (doc §10.4) : coûte 2 appels réseau + une attente,
   * déclenchée seulement quand ce format est effectivement choisi. `null`
   * quand `url` est déjà connue (RapidAPI). */
  resolveToken: string | null;
}

export interface MediaInfo {
  title: string;
  author: string | null;
  thumbnail: string;
  /** Secondes, ou `null` si inconnu/non fiable (voir normalize.ts pour le
   * cas Facebook, qui renvoie parfois des millisecondes). */
  duration: number | null;
  /** "instagram" | "tiktok" | "facebook" | "youtube" | "x" */
  source: string;
  formats: MediaFormat[];
}

export interface MediaDownloadResult {
  url: string;
  filename: string;
  size: number | null;
}
