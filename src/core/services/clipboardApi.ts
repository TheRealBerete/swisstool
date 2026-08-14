import { createClient } from "@/lib/supabase/client";
import { eventBus } from "@/core/services/eventBus";
import { toast } from "@/core/store/useToastStore";
import type { ClipboardItem, ClipboardItemType } from "@/modules/clipboard/types";

/**
 * Service central d'envoi vers le presse-papier partagé.
 *
 * Pourquoi ici et pas dans un hook du module clipboard : le générateur de
 * mot de passe (autre module, autre route) doit pouvoir diffuser un mot de
 * passe SANS que le module Presse-papier soit monté à l'écran. Un hook
 * React lié à un composant ne survivrait pas au changement de page ; un
 * service de `core/` si. Les modules dépendent de `core/`, jamais l'un de
 * l'autre directement — c'est ce qui les garde interchangeables (PRD §4).
 */
export async function shareToClipboard(
  content: string,
  type: ClipboardItemType = "text"
): Promise<ClipboardItem | null> {
  if (!content.trim()) {
    toast.error("Écris un texte à partager");
    return null;
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("clipboard_items")
    .insert({ content, type })
    .select()
    .single();

  if (error) {
    toast.error("📡 Hors ligne. Réessaie quand la connexion revient.");
    return null;
  }

  eventBus.emit("text:shared", { content, type });
  toast.success("Partagé !");
  return data as ClipboardItem;
}
