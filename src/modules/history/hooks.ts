"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { shareToClipboard } from "@/core/services/clipboardApi";
import { toast } from "@/core/store/useToastStore";
import type { ClipboardItem } from "@/modules/clipboard/types";

/**
 * Historique : les 50 dernières entrées (bornées côté DB par un trigger,
 * voir supabase/schema.sql), expirées incluses avec badge — décision
 * prise avec l'utilisateur plutôt qu'une suppression ou un TTL en jours.
 */
export function useHistory() {
  const [items, setItems] = useState<ClipboardItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    // Définie ici (pas via useCallback externe) : le linter React exige
    // que le setState déclenché par un effect reste visiblement local à
    // cet effect, pas caché derrière une fonction importée d'ailleurs.
    async function load() {
      const { data } = await supabase
        .from("clipboard_items")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      setItems((data as ClipboardItem[]) ?? []);
      setLoading(false);
    }
    load();

    // Écoute large ("*") : un partage (INSERT), une suppression (DELETE)
    // depuis un autre appareil doivent tous les deux rafraîchir la liste.
    const channel = supabase
      .channel("history_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "clipboard_items" },
        () => load()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const remove = useCallback(async (id: string) => {
    const supabase = createClient();
    const { error } = await supabase.from("clipboard_items").delete().eq("id", id);
    if (error) {
      toast.error("Suppression impossible");
      return;
    }
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const clearAll = useCallback(async () => {
    const supabase = createClient();
    // Supabase exige un filtre explicite sur delete() — celui-ci matche
    // toutes les lignes (id IS NOT NULL est toujours vrai) sans en oublier.
    const { error } = await supabase.from("clipboard_items").delete().not("id", "is", null);
    if (error) {
      toast.error("Suppression impossible");
      return;
    }
    setItems([]);
    toast.success("Historique vidé");
  }, []);

  const reshare = useCallback(async (item: ClipboardItem) => {
    await shareToClipboard(item.content, item.type);
  }, []);

  return { items, loading, remove, clearAll, reshare };
}
