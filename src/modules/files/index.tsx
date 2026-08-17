"use client";

import { useRef, useState } from "react";
import { Download, File as FileIcon, Loader2, Plus, Trash2, UploadCloud } from "lucide-react";
import { Card } from "@/shared/Card";
import { Button } from "@/shared/Button";
import { Badge } from "@/shared/Badge";
import { isExpired } from "@/shared/CountdownTimer";
import { useSharedFiles } from "./hooks";
import { FileThumbnail } from "./FileThumbnail";
import { MAX_FILE_SIZE_BYTES } from "./types";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("fr-CH", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function FilesModule() {
  const { files, pending, loading, uploading, upload, download, remove, clearAll } =
    useSharedFiles();
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFiles(fileList: FileList | null) {
    const file = fileList?.[0];
    if (file) upload(file);
  }

  return (
    <div className="flex flex-col gap-4 max-w-2xl mx-auto w-full">
      <Card
        className={`p-6 flex flex-col items-center justify-center min-h-[280px] border-dashed border-2 cursor-pointer transition-colors ${
          dragOver ? "border-primary bg-surface-container-low" : "border-outline-variant"
        }`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <div
          className={`w-16 h-16 rounded-2xl bg-surface-container border border-outline-variant flex items-center justify-center mb-4 transition-transform ${
            uploading ? "animate-pulse" : ""
          }`}
        >
          <UploadCloud className={`w-8 h-8 text-primary ${uploading ? "animate-bounce" : ""}`} />
        </div>
        <h3 className="font-headline-md text-headline-md text-on-background mb-1">
          Secure Drop
        </h3>
        <p className="font-body-md text-body-md text-on-surface-variant text-center max-w-sm mb-6">
          Glisse un fichier, colle une image (Ctrl+V) ou clique pour parcourir.
          Expire dans 1h, comme le presse-papier — {MAX_FILE_SIZE_BYTES / 1024 / 1024} Mo max.
        </p>
        <Button
          disabled={uploading}
          onClick={(e) => {
            // stopPropagation évite un 2e déclenchement via l'onClick de la
            // Card parente (même cible), mais il fallait aussi ouvrir le
            // sélecteur ICI — avant, le bouton ne faisait QUE bloquer sa
            // propre propagation sans jamais appeler .click() lui-même, il
            // ne se passait donc littéralement rien au clic dessus.
            e.stopPropagation();
            inputRef.current?.click();
          }}
        >
          <Plus className="w-3.5 h-3.5" />
          {uploading ? "Envoi en cours..." : "Choisir un fichier"}
        </Button>
        {/* Barre indéterminée : Supabase Storage (fetch, pas XHR) ne
            remonte pas de progression en octets exploitable côté client,
            donc on affiche un mouvement continu plutôt qu'un pourcentage
            inventé — signal honnête que "ça travaille", pas une fausse
            précision. */}
        {uploading && (
          <div className="w-full h-1 mt-4 rounded-full bg-surface-container overflow-hidden">
            <div className="h-full w-1/3 rounded-full bg-primary animate-[upload-slide_1.1s_ease-in-out_infinite]" />
          </div>
        )}
      </Card>

      <Card className="flex flex-col overflow-hidden">
        <div className="p-4 border-b border-outline-variant bg-surface-container-low/30 flex justify-between items-center">
          <h3 className="font-headline-sm text-headline-sm text-on-background">
            Fichiers partagés
          </h3>
          {files.length > 0 && (
            <Button
              variant="danger"
              className="px-4 py-1"
              onClick={() => {
                if (window.confirm("Supprimer tous les fichiers partagés ?")) clearAll();
              }}
            >
              <Trash2 className="w-3.5 h-3.5" />
              Tout effacer
            </Button>
          )}
        </div>
        <div className="flex flex-col divide-y divide-outline-variant/50 max-h-[50vh] overflow-y-auto">
          {loading && (
            <p className="font-body-sm text-body-sm text-on-surface-variant p-6 text-center">
              Chargement...
            </p>
          )}
          {!loading && files.length === 0 && pending.length === 0 && (
            <p className="font-body-sm text-body-sm text-on-surface-variant p-6 text-center">
              Aucun fichier partagé pour l&apos;instant.
            </p>
          )}
          {pending.map((p) => (
            <div key={p.id} className="p-4 flex items-center gap-4 opacity-60">
              <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center shrink-0">
                <Loader2 className="w-4 h-4 text-primary animate-spin" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="font-body-sm text-[12px] text-outline">
                  {formatSize(p.size)} · envoi en cours...
                </span>
                <p className="font-mono text-body-sm text-on-background truncate">{p.name}</p>
              </div>
            </div>
          ))}
          {files.map((file) => {
            const expired = isExpired(file.expires_at);
            return (
              <div key={file.id} className="p-4 flex items-center gap-4">
                {file.mime_type?.startsWith("image/") ? (
                  <FileThumbnail file={file} />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center shrink-0">
                    <FileIcon className="w-4 h-4 text-outline" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 mb-1 flex-wrap">
                    {expired && <Badge tone="muted">Expiré</Badge>}
                    <span className="font-body-sm text-[12px] text-outline">
                      {formatSize(file.size_bytes)} · {formatDate(file.created_at)}
                    </span>
                  </div>
                  <p className="font-mono text-body-sm text-on-background truncate">
                    {file.file_name}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    title="Télécharger"
                    onClick={() => download(file)}
                    className="p-1 rounded text-on-surface-variant hover:text-primary hover:bg-surface-container-low transition-colors"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    title="Supprimer"
                    onClick={() => remove(file)}
                    className="p-1 rounded text-on-surface-variant hover:text-error hover:bg-error-container/20 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
