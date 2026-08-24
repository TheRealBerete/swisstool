import type { MediaFormat, MediaInfo } from "./types";

/** RapidAPI/VidsSave ne donnent pas de nom de fichier tout pret (au
 * contraire de Lotus, remplace) - on le construit nous-memes a partir du
 * titre, nettoye pour rester un nom de fichier valide sur tous les OS
 * (Windows interdit les caracteres speciaux type deux-points/slash, on va
 * plus simple : on ne garde que lettres/chiffres). */
const DIACRITICS_REGEX = new RegExp("[̀-ͯ]", "g");

function slugify(text: string): string {
  return (
    text
      .normalize("NFKD")
      .replace(DIACRITICS_REGEX, "") // retire les accents apres decomposition
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "media"
  );
}

export function buildFilename(info: MediaInfo, format: MediaFormat): string {
  return `${slugify(info.title || info.source)}.${format.ext}`;
}
