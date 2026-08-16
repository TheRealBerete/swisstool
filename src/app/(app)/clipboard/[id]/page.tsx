import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ClipboardItem } from "@/modules/clipboard/types";
import { ClipboardItemView } from "@/modules/clipboard/ClipboardItemView";

/**
 * Page de lecture dédiée à UN partage — c'est là que pointe le QR code
 * quand le texte est trop long pour être encodé directement dedans (voir
 * le seuil QR_RAW_THRESHOLD dans modules/clipboard/index.tsx). Toujours
 * derrière l'auth (comme le reste de l'appli, cf. src/proxy.ts) : ce n'est
 * pas un lien de partage public, juste un raccourci pratique entre TES
 * propres appareils déjà connectés au même compte.
 */
export default async function ClipboardItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("clipboard_items")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!data) notFound();

  return <ClipboardItemView item={data as ClipboardItem} />;
}
