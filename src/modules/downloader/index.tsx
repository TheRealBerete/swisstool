"use client";

import { useState } from "react";
import {
  ClipboardCopy,
  Clock,
  Download,
  Film,
  Link2,
  Loader2,
  Music,
  RotateCcw,
  Smartphone,
  Video,
} from "lucide-react";
import { Card } from "@/shared/Card";
import { Button } from "@/shared/Button";
import { Input } from "@/shared/Input";
import { Badge } from "@/shared/Badge";
import { copyToClipboard } from "@/modules/clipboard/hooks";
import { useMediaDownloader } from "./hooks";
import type { LotusFormat } from "./types";

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const mm = String(m).padStart(h > 0 ? 2 : 1, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

function formatSize(bytes: number): string {
  if (!bytes) return "taille inconnue";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function formatLabel(format: LotusFormat): string {
  if (format.vcodec === "none") return "Audio";
  return format.fps ? `${format.resolution} ${format.fps}fps` : format.resolution;
}

type Tab = "video" | "audio";

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
  const [tab, setTab] = useState<Tab>("video");

  const videoFormats = (info?.formats ?? [])
    .filter((f) => f.vcodec !== "none")
    .sort((a, b) => b.height - a.height);
  const audioFormats = (info?.formats ?? [])
    .filter((f) => f.vcodec === "none")
    .sort((a, b) => b.filesize - a.filesize);
  const visibleFormats = tab === "video" ? videoFormats : audioFormats;
  const selectedFormat = info?.formats.find((f) => f.format_id === selectedFormatId) ?? null;
  const isVideoResult = !!selectedFormat && selectedFormat.vcodec !== "none";

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
          Colle le lien d&apos;une vidéo (YouTube et autres plateformes prises en charge) pour
          récupérer un lien de téléchargement direct.
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
                {info.title}
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge>{info.platform}</Badge>
                <span className="flex items-center gap-1 font-body-sm text-[12px] text-outline">
                  <Clock className="w-3 h-3" />
                  {formatDuration(info.duration)}
                </span>
              </div>
            </div>
          </div>

          <div className="p-4 flex flex-col gap-3">
            <div className="flex gap-1 bg-surface-container p-1 rounded-xl w-fit">
              <button
                onClick={() => setTab("video")}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg font-label-md text-label-md transition-colors ${
                  tab === "video"
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
                const active = format.format_id === selectedFormatId;
                const withAudio = format.vcodec !== "none" && format.acodec !== "none";
                return (
                  <button
                    key={format.format_id}
                    onClick={() => setSelectedFormatId(format.format_id)}
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
                        {formatLabel(format)}
                      </span>
                      <Badge tone="muted" className="uppercase shrink-0">
                        {format.ext}
                      </Badge>
                      {withAudio && (
                        <Badge tone="neutral" className="hidden sm:inline">
                          Avec son
                        </Badge>
                      )}
                    </div>
                    <span className="font-body-sm text-[12px] text-outline shrink-0">
                      {formatSize(format.filesize)}
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
                {isVideoResult && (
                  <>
                    {/* <video> plutôt qu'un simple lien : c'est CETTE balise qui
                        permet l'astuce "appui long → Enregistrer la vidéo" sur
                        iPhone. Un <video> lit un fichier distant sans avoir
                        besoin d'en-têtes CORS (contrairement à un fetch() en
                        JS) — c'est le navigateur qui charge le flux nativement,
                        pas notre code, donc la politique CORS ne s'applique pas
                        ici. Sources : WebKit/MDN, cf. récap pédagogique. */}
                    <video
                      key={result.url}
                      controls
                      playsInline
                      poster={info.thumbnail || undefined}
                      className="w-full rounded-lg bg-black max-h-80"
                    >
                      <source
                        src={result.url}
                        type={`video/${selectedFormat?.ext === "mp4" ? "mp4" : selectedFormat?.ext}`}
                      />
                    </video>
                    {selectedFormat?.ext === "mp4" ? (
                      <p className="flex items-start gap-1.5 font-body-sm text-body-sm text-on-surface-variant">
                        <Smartphone className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span>
                          Sur iPhone : appuie longuement sur la vidéo ci-dessus, puis choisis{" "}
                          <strong className="text-on-background">Enregistrer la vidéo</strong> —
                          elle est ajoutée directement à ta galerie Photos.
                        </span>
                      </p>
                    ) : (
                      <p className="flex items-start gap-1.5 font-body-sm text-body-sm text-on-surface-variant">
                        <Smartphone className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span>
                          Format {selectedFormat?.ext.toUpperCase()} : Safari (iPhone) ne peut pas le
                          lire. Choisis un format <strong className="text-on-background">MP4</strong>{" "}
                          ci-dessus pour prévisualiser et enregistrer directement dans la galerie.
                        </span>
                      </p>
                    )}
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
