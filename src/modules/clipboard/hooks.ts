"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { shareToClipboard } from "@/core/services/clipboardApi";
import { toast } from "@/core/store/useToastStore";
import type { ClipboardItem, ClipboardItemType } from "./types";

/**
 * Gère le partage actif du presse-papier : lit le dernier partage au
 * montage, puis reste à l'écoute en Realtime pour tout nouveau partage
 * émis depuis un autre appareil (ou un autre module, ex: générateur MDP).
 */
export function useSharedClipboard() {
  const [latest, setLatest] = useState<ClipboardItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    async function loadLatest() {
      const { data } = await supabase
        .from("clipboard_items")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (active) {
        setLatest(data as ClipboardItem | null);
        setLoading(false);
      }
    }
    loadLatest();

    // 🧠 Realtime : Supabase pousse les INSERT via WebSocket à tous les
    // clients abonnés au même canal. C'est ce qui permet à un partage fait
    // sur PC d'apparaître instantanément sur le téléphone, sans recharger
    // la page ni faire de polling.
    const channel = supabase
      .channel("clipboard_items_changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "clipboard_items" },
        (payload) => setLatest(payload.new as ClipboardItem)
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const shareText = useCallback(async (content: string, type: ClipboardItemType = "text") => {
    const item = await shareToClipboard(content, type);
    if (item) setLatest(item);
    return !!item;
  }, []);

  return { latest, loading, shareText };
}

export async function copyToClipboard(text: string) {
  await navigator.clipboard.writeText(text);
  toast.success("Copié dans le presse-papier");
}
