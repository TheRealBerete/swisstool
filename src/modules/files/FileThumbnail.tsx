"use client";

import { useEffect, useState } from "react";
import { ImageIcon } from "lucide-react";
import { getDownloadUrl } from "@/core/services/filesApi";
import { Lightbox } from "@/shared/Lightbox";
import type { SharedFile } from "./types";

/**
 * Miniature cliquable pour un fichier image : génère une URL signée au
 * montage (via le même service que le téléchargement), l'affiche en
 * vignette, et ouvre une Lightbox plein écran au clic.
 */
export function FileThumbnail({ file }: { file: SharedFile }) {
  const [url, setUrl] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let active = true;
    getDownloadUrl(file.storage_path).then((signedUrl) => {
      if (active) setUrl(signedUrl);
    });
    return () => {
      active = false;
    };
  }, [file.storage_path]);

  if (!url) {
    return (
      <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center shrink-0">
        <ImageIcon className="w-4 h-4 text-outline animate-pulse" />
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        title="Aperçu"
        onClick={() => setOpen(true)}
        className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-outline-variant"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={file.file_name} className="w-full h-full object-cover" />
      </button>
      {open && <Lightbox src={url} alt={file.file_name} onClose={() => setOpen(false)} />}
    </>
  );
}
