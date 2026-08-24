import type { RapidApiMedia, RapidApiMediaResponse, VidsSaveParseData } from "./raw-types";
import type { MediaFormat, MediaInfo } from "./types";

export function isYoutubeUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase().replace(/^www\./, "");
    return host === "youtube.com" || host === "m.youtube.com" || host === "youtu.be" || host.endsWith(".youtube.com");
  } catch {
    return false;
  }
}

export function normalizeVidsSave(data: VidsSaveParseData): MediaInfo {
  return {
    title: data.title,
    author: null,
    thumbnail: data.thumbnail,
    duration: typeof data.duration === "number" && data.duration > 0 ? data.duration : null,
    source: "youtube",
    formats: data.resources.map((r, i) => {
      const heightMatch = /^(\d+)P$/i.exec(r.quality);
      return {
        id: `vs-${i}`,
        kind: r.type,
        label: r.quality,
        ext: r.format.toLowerCase(),
        width: null,
        height: heightMatch ? Number(heightMatch[1]) : null,
        size: typeof r.size === "number" ? r.size : null,
        url: null,
        resolveToken: r.resource_content,
      } satisfies MediaFormat;
    }),
  };
}

export function normalizeRapidApi(data: RapidApiMediaResponse): MediaInfo {
  return {
    title: data.title ?? "",
    author: data.author ?? null,
    thumbnail: data.thumbnail ?? "",
    duration: normalizeDuration(data.duration),
    source: data.source,
    formats: (data.medias ?? []).map((m, i) => ({
      id: `ra-${i}`,
      kind: m.type,
      label: buildLabel(m),
      ext: (m.extension ?? m.ext ?? "mp4").toLowerCase(),
      width: m.width ?? null,
      height: m.height ?? null,
      size: m.data_size ?? null,
      url: m.url,
      resolveToken: null,
    })),
  };
}

function buildLabel(m: RapidApiMedia): string {
  if (m.quality) return m.quality;
  if (m.label) return m.label;
  if (m.width && m.height) return `${m.width}x${m.height}`;
  return m.type === "audio" ? "audio" : (m.extension ?? m.ext ?? "").toUpperCase();
}

/**
 * 🧠 Pourquoi cette heuristique — RapidAPI renvoie `duration` en SECONDES
 * pour YouTube/TikTok mais en MILLISECONDES sur Facebook (constaté et
 * documenté dans allmediasaver-api-doc.md §5 : `74304` ≈ 74s, pas 20h).
 * Comme le champ ne dit jamais lui-même son unité, on applique un test de
 * plausibilité : aucune vidéo de réseau social ne dure plus de 6h (21600s)
 * — au-delà, c'est presque certainement des millisecondes, on divise par
 * 1000. Imparfait (une vidéo de 5h59 en secondes serait mal interprétée
 * si l'API donnait des ms pour une valeur proche), mais couvre le cas
 * réel observé sans complexifier avec une détection par plateforme.
 */
function normalizeDuration(raw: number | undefined): number | null {
  if (typeof raw !== "number" || raw <= 0) return null;
  return raw > 21_600 ? Math.round(raw / 1000) : raw;
}
