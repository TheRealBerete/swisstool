"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { deleteFile, getDownloadUrl, uploadFile } from "@/core/services/filesApi";
import { toast } from "@/core/store/useToastStore";
import type { SharedFile } from "./types";

/** Upload en cours, affiché comme ligne "fantôme" dans la liste le temps
 * que la vraie ligne (avec son id définitif) arrive. */
export interface PendingUpload {
  id: string;
  name: string;
  size: number;
}

export function useSharedFiles() {
  const [files, setFiles] = useState<SharedFile[]>([]);
  const [pending, setPending] = useState<PendingUpload[]>([]);
  const [loading, setLoading] = useState(true);

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

    // Realtime appliqué directement depuis le payload (pas de re-fetch) —
    // même technique que le presse-papier : un aller-retour réseau en
    // moins, donc un upload fait sur un autre appareil apparaît vraiment
    // "instantanément" plutôt qu'après un rechargement complet de liste.
    const channel = supabase
      .channel("shared_files_changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "shared_files" },
        (payload) => {
          const row = payload.new as SharedFile;
          setFiles((prev) => (prev.some((f) => f.id === row.id) ? prev : [row, ...prev]));
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "shared_files" },
        (payload) => {
          const row = payload.old as Pick<SharedFile, "id">;
          setFiles((prev) => prev.filter((f) => f.id !== row.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const upload = useCallback(async (file: File) => {
    // Ligne fantôme affichée immédiatement (avant même que l'upload réseau
    // ne démarre) : c'est ça qui donne le retour visuel instantané, pas
    // d'attendre que Supabase confirme quoi que ce soit.
    const tempId = crypto.randomUUID();
    setPending((prev) => [...prev, { id: tempId, name: file.name, size: file.size }]);

    const item = await uploadFile(file);

    setPending((prev) => prev.filter((p) => p.id !== tempId));
    if (item) {
      // Ajout optimiste local — le filtre anti-doublon protège contre le
      // cas où l'événement Realtime serait déjà arrivé entre-temps.
      setFiles((prev) => (prev.some((f) => f.id === item.id) ? prev : [item, ...prev]));
    }
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

  return {
    files,
    pending,
    loading,
    uploading: pending.length > 0,
    upload,
    download,
    remove,
    clearAll,
  };
}
