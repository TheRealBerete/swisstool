"use client";

import { useCallback, useState } from "react";
import { fetchVideoInfo, requestDownload } from "@/core/services/lotusApi";
import { shareToClipboard } from "@/core/services/clipboardApi";
import { toast } from "@/core/store/useToastStore";
import type { LotusDownloadResult, LotusFormat, LotusVideoInfo } from "./types";

type Status = "idle" | "analyzing" | "ready" | "downloading";

/** Choisit le format pré-sélectionné à l'ouverture des résultats : en
 * priorité un format "progressif" (vidéo + audio dans le même fichier, donc
 * lisible tel quel sans montage) à la meilleure résolution, sinon la
 * meilleure vidéo disponible (adaptative, sans son) — évite un clic de plus
 * pour le cas d'usage le plus courant ("juste télécharger la vidéo").
 *
 * Second critère (après vidéo+son) : le conteneur MP4 passe avant WebM à
 * qualité égale. Safari/iOS ne sait pas lire le WebM dans une balise
 * <video> — or c'est justement cette balise qui permet l'astuce "appui
 * long → Enregistrer la vidéo" pour sauver direct dans la pellicule sur
 * iPhone (voir DownloaderModule). Présélectionner du MP4 quand ça existe
 * rend ce chemin utilisable sans que l'utilisateur ait à connaître cette
 * contrainte lui-même. */
function pickDefaultFormat(formats: LotusFormat[]): string | null {
  const withAudio = formats.filter((f) => f.vcodec !== "none" && f.acodec !== "none");
  const anyVideo = formats.filter((f) => f.vcodec !== "none");
  const pool = withAudio.length > 0 ? withAudio : anyVideo.length > 0 ? anyVideo : formats;
  const ranked = [...pool].sort((a, b) => {
    // Tri décroissant sur "est-ce du mp4" (1 avant 0) : b - a, pas a - b.
    const mp4Rank = (b.ext === "mp4" ? 1 : 0) - (a.ext === "mp4" ? 1 : 0);
    return mp4Rank !== 0 ? mp4Rank : b.height - a.height;
  });
  return ranked[0]?.format_id ?? null;
}

export function useMediaDownloader() {
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [info, setInfo] = useState<LotusVideoInfo | null>(null);
  const [selectedFormatId, setSelectedFormatId] = useState<string | null>(null);
  const [result, setResult] = useState<LotusDownloadResult | null>(null);

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

    const data = await fetchVideoInfo(trimmed);
    if (!data) {
      setStatus("idle");
      return;
    }
    setInfo(data);
    setSelectedFormatId(pickDefaultFormat(data.formats));
    setStatus("ready");
  }, [url]);

  const download = useCallback(async () => {
    if (!selectedFormatId) return;
    setStatus("downloading");
    const data = await requestDownload(url.trim(), selectedFormatId);
    setStatus("ready");
    if (data) {
      setResult(data);
      toast.success("Lien de téléchargement prêt !");
    }
  }, [selectedFormatId, url]);

  // Le lien R2 renvoyé par Lotus est temporaire (signé) — le partager via le
  // presse-papier SwissTool permet de l'ouvrir sur un autre appareil du
  // même compte (ex: lancer le téléchargement sur PC depuis le téléphone),
  // tant que le lien n'a pas expiré côté R2.
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
