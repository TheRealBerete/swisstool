"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { deleteFile, getDownloadUrl, uploadFile } from "@/core/services/filesApi";
import { toast } from "@/core/store/useToastStore";
import type { SharedFile } from "./types";

export function useSharedFiles() {
  const [files, setFiles] = useState<SharedFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      const { data } = await supabase
        .from("shared_files")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      setFiles((data as SharedFile[]) ?? []);
      setLoading(false);
    }
    load();

    // Realtime : un upload depuis un autre appareil doit apparaître ici
    // sans recharger la page, même logique que le presse-papier.
    const channel = supabase
      .channel("shared_files_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "shared_files" },
        () => load()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const upload = useCallback(async (file: File) => {
    setUploading(true);
    const item = await uploadFile(file);
    setUploading(false);
    if (item) setFiles((prev) => [item, ...prev]);
  }, []);

  const download = useCallback(async (file: SharedFile) => {
    const url = await getDownloadUrl(file.storage_path);
    if (!url) return;
    // Ouvre le lien signé dans un nouvel onglet — le navigateur gère le
    // téléchargement lui-même (Content-Disposition renvoyé par Storage).
    window.open(url, "_blank", "noopener,noreferrer");
  }, []);

  const remove = useCallback(async (file: SharedFile) => {
    const ok = await deleteFile(file);
    if (ok) setFiles((prev) => prev.filter((f) => f.id !== file.id));
  }, []);

  const clearAll = useCallback(async () => {
    const ok = await Promise.all(files.map((f) => deleteFile(f)));
    if (ok.every(Boolean)) {
      setFiles([]);
      toast.success("Fichiers supprimés");
    } else {
      // Suppression partielle : on ne masque pas l'échec, on recharge
      // pour montrer l'état réel plutôt qu'un state local incorrect.
      setFiles((prev) => prev.filter((_, i) => !ok[i]));
    }
  }, [files]);

  return { files, loading, uploading, upload, download, remove, clearAll };
}
