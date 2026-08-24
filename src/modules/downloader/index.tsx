"use client";

import { useState, useSyncExternalStore } from "react";
import {
  ClipboardCopy,
  Clock,
  Download,
  Film,
  Link2,
  Loader2,
  Music,
  RotateCcw,
  Share2,
  Video,
} from "lucide-react";
import { Card } from "@/shared/Card";
import { Button } from "@/shared/Button";
import { Input } from "@/shared/Input";
import { Badge } from "@/shared/Badge";
import { copyToClipboard } from "@/modules/clipboard/hooks";
import { fetchAsFile } from "@/core/services/downloaderApi";
import { toast } from "@/core/store/useToastStore";
import { useMediaDownloader } from "./hooks";

function formatDuration(seconds: number | null): string {
  if (seconds == null) return "—";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const mm = String(m).padStart(h > 0 ? 2 : 1, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

function formatSize(bytes: number | null): string {
  if (!bytes) return "taille inconnue";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

type Tab = "primary" | "audio";

// `navigator.share` n'existe pas côté serveur (Node n'a pas de `navigator`)
// — useSyncExternalStore est le hook pensé pour exactement ce cas : une
// valeur lue dans l'environnement navigateur, `false` pendant le rendu
// serveur/l'hydratation initiale (getServerSnapshot), la vraie valeur
// ensuite (getSnapshot). Pas d'abonnement réel à faire (le support de
// l'API ne change jamais en cours de session), donc `subscribe` est un
// no-op — mais il faut quand même le fournir, c'est le contrat du hook.
const noopSubscribe = () => () => {};
function useCanNativeShare(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => typeof navigator !== "undefined" && typeof navigator.share === "function",
    () => false
  );
}

export function DownloaderModule() {
  const {
    url,
    setUrl,
    info,
    selectedFormatId,
    setSelectedFormatId,
    result,
    analyze,
    download,
    shareLink,
    reset,
    analyzing,
    downloading,
  } = useMediaDownloader();
  const [tab, setTab] = useState<Tab>("primary");
  const canNativeShare = useCanNativeShare();
  const [savingToGallery, setSavingToGallery] = useState(false);

  // "primary" regroupe vidéo + photo (le cas photo-seule est rare — un
  // tweet X sans vidéo, typiquement — pas la peine d'un 3e onglet dédié).
  const primaryFormats = (info?.formats ?? [])
    .filter((f) => f.kind !== "audio")
    .sort((a, b) => (b.height ?? 0) - (a.height ?? 0));
  const audioFormats = (info?.formats ?? [])
    .filter((f) => f.kind === "audio")
    .sort((a, b) => (b.size ?? 0) - (a.size ?? 0));
  const visibleFormats = tab === "primary" ? primaryFormats : audioFormats;
  const selectedFormat = info?.formats.find((f) => f.id === selectedFormatId) ?? null;

  /**
   * Bouton "Enregistrer dans Photos" — utilise `navigator.share({ files })`
   * pour ouvrir la feuille de partage native iOS/Android, où
   * "Enregistrer la vidéo"/"Photos" est une cible de premier niveau —
   * déterministe, pas un geste caché à découvrir. Nécessite les octets
   * réels (fetchAsFile passe par notre proxy /api/downloader/stream, seul
   * moyen de contourner le CORS des CDN médias pour un fetch() JS).
   */
  async function saveToGallery() {
    if (!result || !selectedFormat) return;
    setSavingToGallery(true);
    try {
      const mimeType =
        selectedFormat.kind === "photo" ? `image/${selectedFormat.ext}` : `video/${selectedFormat.ext}`;
      const file = await fetchAsFile(result.url, result.filename, mimeType);
      if (!file) return; // fetchAsFile a déjà affiché le toast d'erreur

      if (!navigator.canShare?.({ files: [file] })) {
        toast.error("Le partage de fichiers n'est pas supporté ici — utilise Télécharger.");
        return;
      }
      await navigator.share({ files: [file], title: result.filename });
    } catch (err) {
      // AbortError : l'utilisateur a juste fermé la feuille de partage,
      // ce n'est pas un échec à signaler.
      if ((err as DOMException)?.name !== "AbortError") {
        toast.error("Échec de l'enregistrement");
      }
    } finally {
      setSavingToGallery(false);
    }
  }

  async function handlePaste() {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setUrl(text.trim());
    } catch {
      // Permission presse-papier refusée par le navigateur — pas bloquant,
      // l'utilisateur peut toujours coller manuellement (Ctrl+V) dans le champ.
    }
  }

  return (
    <div className="flex flex-col gap-4 max-w-2xl mx-auto w-full">
      <Card className="p-6 flex flex-col gap-4">
        <h3 className="font-headline-sm text-headline-sm text-on-background flex items-center gap-2">
          <Film className="w-5 h-5 text-primary" />
          Téléchargeur de médias
        </h3>
        <p className="font-body-sm text-body-sm text-on-surface-variant -mt-2">
          Colle le lien d&apos;un post Instagram, TikTok, Facebook, X/Twitter ou d&apos;une vidéo
          YouTube pour récupérer un lien de téléchargement direct.
        </p>
        <div className="flex gap-2">
          <Input
            placeholder="https://..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !analyzing) analyze();
            }}
            className="flex-1"
          />
          <Button
            variant="secondary"
            onClick={handlePaste}
            title="Coller depuis le presse-papier"
            aria-label="Coller depuis le presse-papier"
          >
            <ClipboardCopy className="w-3.5 h-3.5" />
          </Button>
        </div>
        <Button onClick={analyze} disabled={analyzing || !url.trim()} className="self-end">
          {analyzing ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Link2 className="w-3.5 h-3.5" />
          )}
          {analyzing ? "Analyse..." : "Analyser"}
        </Button>
      </Card>

      {analyzing && (
        <Card className="p-6 flex flex-col gap-4 animate-pulse">
          <div className="h-28 bg-surface-container rounded-lg" />
          <div className="h-4 w-2/3 bg-surface-container rounded" />
          <div className="h-4 w-1/3 bg-surface-container rounded" />
        </Card>
      )}

      {info && (
        <Card className="flex flex-col overflow-hidden">
          <div className="flex gap-4 p-4 border-b border-outline-variant bg-surface-container-low/30">
            {info.thumbnail && (
              // URL externe fournie par la plateforme source (domaine
              // variable selon YouTube/TikTok/...) : next/image exigerait
              // un allow-list par domaine, un <img> classique évite ça.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={info.thumbnail}
                alt=""
                className="w-28 h-16 object-cover rounded-lg shrink-0 bg-surface-container"
              />
            )}
            <div className="min-w-0 flex flex-col gap-1 justify-center">
              <p className="font-body-md text-body-md text-on-background line-clamp-2">
                {info.title || "Sans titre"}
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge>{info.source}</Badge>
                {info.author && (
                  <span className="font-body-sm text-[12px] text-outline truncate max-w-[10rem]">
                    @{info.author}
                  </span>
                )}
                {info.duration != null && (
                  <span className="flex items-center gap-1 font-body-sm text-[12px] text-outline">
                    <Clock className="w-3 h-3" />
                    {formatDuration(info.duration)}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="p-4 flex flex-col gap-3">
            <div className="flex gap-1 bg-surface-container p-1 rounded-xl w-fit">
              <button
                onClick={() => setTab("primary")}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg font-label-md text-label-md transition-colors ${
                  tab === "primary"
                    ? "bg-surface-container-lowest text-primary shadow-sm"
                    : "text-on-surface-variant hover:text-on-background"
                }`}
              >
                <Video className="w-3.5 h-3.5" />
                Vidéo
              </button>
              <button
                onClick={() => setTab("audio")}
                disabled={audioFormats.length === 0}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg font-label-md text-label-md transition-colors disabled:opacity-40 ${
                  tab === "audio"
                    ? "bg-surface-container-lowest text-primary shadow-sm"
                    : "text-on-surface-variant hover:text-on-background"
                }`}
              >
                <Music className="w-3.5 h-3.5" />
                Audio seul
              </button>
            </div>

            <div className="flex flex-col divide-y divide-outline-variant/50 max-h-64 overflow-y-auto rounded-lg border border-outline-variant">
              {visibleFormats.length === 0 && (
                <p className="font-body-sm text-body-sm text-on-surface-variant p-4 text-center">
                  Aucun format disponible dans cette catégorie.
                </p>
              )}
              {visibleFormats.map((format) => {
                const active = format.id === selectedFormatId;
                return (
                  <button
                    key={format.id}
                    onClick={() => setSelectedFormatId(format.id)}
                    className={`flex items-center justify-between gap-3 px-4 py-2.5 text-left transition-colors ${
                      active ? "bg-primary/10" : "hover:bg-surface-container-low"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={`w-3.5 h-3.5 rounded-full border-2 shrink-0 ${
                          active ? "border-primary bg-primary" : "border-outline"
                        }`}
                      />
                      <span className="font-mono text-body-sm text-on-background shrink-0">
                        {format.label}
                      </span>
                      <Badge tone="muted" className="uppercase shrink-0">
                        {format.ext}
                      </Badge>
                    </div>
                    <span className="font-body-sm text-[12px] text-outline shrink-0">
                      {formatSize(format.size)}
                    </span>
                  </button>
                );
              })}
            </div>

            <Button
              onClick={download}
              disabled={!selectedFormatId || downloading}
              className="w-full"
            >
              {downloading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              {downloading ? "Génération du lien..." : "Générer le lien de téléchargement"}
            </Button>
            {downloading && (
              <div className="w-full h-1 -mt-2 rounded-full bg-surface-container overflow-hidden">
                <div className="h-full w-1/3 rounded-full bg-primary animate-[upload-slide_1.1s_ease-in-out_infinite]" />
              </div>
            )}

            {result && (
              <div className="flex flex-col gap-3 p-4 rounded-lg bg-surface-container-low border border-outline-variant">
                {selectedFormat?.kind === "video" && (
                  <>
                    {/* Aperçu seulement — un <video> lit un fichier distant sans
                        en-têtes CORS (contrairement à un fetch() JS), donc pas
                        besoin de passer par notre proxy ici. */}
                    <video
                      key={result.url}
                      controls
                      playsInline
                      poster={info.thumbnail || undefined}
                      className="w-full rounded-lg bg-black max-h-80"
                    >
                      <source
                        src={result.url}
                        type={`video/${selectedFormat.ext === "mp4" ? "mp4" : selectedFormat.ext}`}
                      />
                    </video>
                    {selectedFormat.ext !== "mp4" && (
                      <p className="font-body-sm text-body-sm text-on-surface-variant">
                        Format {selectedFormat.ext.toUpperCase()} : Safari (iPhone) ne peut pas
                        lire l&apos;aperçu ci-dessus. Choisis un format{" "}
                        <strong className="text-on-background">MP4</strong> dans la liste si tu
                        veux prévisualiser avant d&apos;enregistrer.
                      </p>
                    )}
                  </>
                )}
                {selectedFormat?.kind === "photo" && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={result.url}
                    alt=""
                    className="w-full rounded-lg bg-black max-h-80 object-contain"
                  />
                )}
                {canNativeShare && selectedFormat?.kind !== "audio" && (
                  <>
                    <Button onClick={saveToGallery} disabled={savingToGallery} className="w-full">
                      {savingToGallery ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Share2 className="w-3.5 h-3.5" />
                      )}
                      {savingToGallery ? "Préparation..." : "Enregistrer dans Photos"}
                    </Button>
                    <p className="font-body-sm text-[11px] text-on-surface-variant -mt-1">
                      Ouvre le menu de partage natif — choisis{" "}
                      <strong className="text-on-background">Enregistrer la vidéo</strong> (iPhone)
                      ou <strong className="text-on-background">Photos</strong> (Android) pour
                      l&apos;ajouter directement à ta galerie.
                    </p>
                  </>
                )}
                <p className="font-mono text-body-sm text-on-background truncate">
                  {result.filename}
                </p>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    className="flex-1"
                    onClick={() => window.open(result.url, "_blank", "noopener,noreferrer")}
                  >
                    <Download className="w-3.5 h-3.5" />
                    Télécharger
                  </Button>
                  <Button variant="secondary" onClick={() => copyToClipboard(result.url)}>
                    <ClipboardCopy className="w-3.5 h-3.5" />
                    Copier
                  </Button>
                  <Button variant="secondary" onClick={shareLink}>
                    <Link2 className="w-3.5 h-3.5" />
                    Envoyer au presse-papier
                  </Button>
                </div>
                <p className="font-body-sm text-[11px] text-on-surface-variant">
                  Lien temporaire — enregistre-le rapidement, ou envoie-le au presse-papier
                  SwissTool pour le récupérer sur un autre appareil avant qu&apos;il n&apos;expire.
                </p>
              </div>
            )}

            <button
              onClick={reset}
              className="self-center flex items-center gap-1 font-label-md text-label-md text-on-surface-variant hover:text-on-background transition-colors mt-1"
            >
              <RotateCcw className="w-3 h-3" />
              Nouveau lien
            </button>
          </div>
        </Card>
      )}
    </div>
  );
}
