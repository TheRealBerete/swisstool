"use client";

import { useCallback, useState } from "react";
import { fetchMediaInfo, resolveFormatUrl } from "@/core/services/downloaderApi";
import { shareToClipboard } from "@/core/services/clipboardApi";
import { toast } from "@/core/store/useToastStore";
import { buildFilename } from "./format";
import type { MediaDownloadResult, MediaFormat, MediaInfo } from "./types";

type Status = "idle" | "analyzing" | "ready" | "downloading";

/** Choisit le format pré-sélectionné à l'ouverture des résultats : la
 * meilleure vidéo dispo en MP4 si possible. Contrairement à Lotus
 * (remplacé), RapidAPI et VidsSave renvoient tous les deux des fichiers
 * déjà complets (vidéo + son intégré, voir allmediasaver-api-doc.md
 * §10.1) — pas de piste vidéo "muette" à éviter ici, donc plus besoin de
 * filtrer par présence de son comme avant. Le MP4 reste préféré au WebM
 * car Safari/iOS ne sait pas le lire dans une balise <video> (nécessaire
 * pour l'aperçu ET le bouton "Enregistrer dans Photos"). */
function pickDefaultFormat(formats: MediaFormat[]): string | null {
  const videos = formats.filter((f) => f.kind === "video");
  const pool = videos.length > 0 ? videos : formats;
  const ranked = [...pool].sort((a, b) => {
    // Tri décroissant sur "est-ce du mp4" (1 avant 0) : b - a, pas a - b.
    const mp4Rank = (b.ext === "mp4" ? 1 : 0) - (a.ext === "mp4" ? 1 : 0);
    if (mp4Rank !== 0) return mp4Rank;
    return (b.height ?? 0) - (a.height ?? 0);
  });
  return ranked[0]?.id ?? null;
}

export function useMediaDownloader() {
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [info, setInfo] = useState<MediaInfo | null>(null);
  const [selectedFormatId, setSelectedFormatId] = useState<string | null>(null);
  const [result, setResult] = useState<MediaDownloadResult | null>(null);

  const analyze = useCallback(async () => {
    const trimmed = url.trim();
    if (!trimmed) {
      toast.error("Colle un lien de vidéo");
      return;
    }
    setStatus("analyzing");
    setInfo(null);
    setResult(null);
    setSelectedFormatId(null);

    const data = await fetchMediaInfo(trimmed);
    if (!data) {
      setStatus("idle");
      return;
    }
    setInfo(data);
    setSelectedFormatId(pickDefaultFormat(data.formats));
    setStatus("ready");
  }, [url]);

  const download = useCallback(async () => {
    if (!selectedFormatId || !info) return;
    const format = info.formats.find((f) => f.id === selectedFormatId);
    if (!format) return;

    setStatus("downloading");

    // RapidAPI donne déjà l'URL finale dès l'étape "info" — aucun appel
    // réseau supplémentaire nécessaire. VidsSave (YouTube) ne donne qu'un
    // jeton à ce stade (résolution paresseuse, doc §10.4) : il faut un
    // aller-retour serveur qui peut prendre plusieurs secondes (attente
    // SSE côté VidsSave) — d'où la réutilisation du statut "downloading"
    // pour les deux cas, même si l'un est quasi instantané.
    if (format.url) {
      setResult({ url: format.url, filename: buildFilename(info, format), size: format.size });
      setStatus("ready");
      toast.success("Lien de téléchargement prêt !");
      return;
    }

    if (!format.resolveToken) {
      toast.error("Format indisponible");
      setStatus("ready");
      return;
    }
    const resolved = await resolveFormatUrl(format.resolveToken);
    setStatus("ready");
    if (resolved) {
      setResult({
        url: resolved.url,
        filename: buildFilename(info, format),
        size: resolved.size ?? format.size,
      });
      toast.success("Lien de téléchargement prêt !");
    }
  }, [selectedFormatId, info]);

  // Le lien renvoyé est temporaire (signé) — le partager via le
  // presse-papier SwissTool permet de l'ouvrir sur un autre appareil du
  // même compte (ex: lancer le téléchargement sur PC depuis le téléphone),
  // tant que le lien n'a pas expiré côté fournisseur.
  const shareLink = useCallback(async () => {
    if (!result) return;
    await shareToClipboard(result.url, "link");
  }, [result]);

  const reset = useCallback(() => {
    setUrl("");
    setInfo(null);
    setResult(null);
    setSelectedFormatId(null);
    setStatus("idle");
  }, []);

  return {
    url,
    setUrl,
    status,
    info,
    selectedFormatId,
    setSelectedFormatId,
    result,
    analyze,
    download,
    shareLink,
    reset,
    analyzing: status === "analyzing",
    downloading: status === "downloading",
  };
}
