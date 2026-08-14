import { createClient } from "@/lib/supabase/client";
import { toast } from "@/core/store/useToastStore";
import { FILES_BUCKET, MAX_FILE_SIZE_BYTES, type SharedFile } from "@/modules/files/types";

/**
 * Service central pour le module Fichiers (Supabase Storage). Même
 * raisonnement que `clipboardApi.ts` : vit dans `core/` pour rester
 * appelable depuis n'importe quel module futur (ex: joindre un fichier à
 * une note), pas seulement depuis l'écran Fichiers lui-même.
 */
export async function uploadFile(file: File): Promise<SharedFile | null> {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    toast.error(`Fichier trop lourd (max ${MAX_FILE_SIZE_BYTES / 1024 / 1024} Mo)`);
    return null;
  }

  const supabase = createClient();
  // Préfixe aléatoire : deux fichiers du même nom ne doivent jamais se
  // marcher dessus dans le bucket (partagé par un seul compte, mais ça
  // reste un espace de stockage plat).
  const storagePath = `${crypto.randomUUID()}-${file.name}`;

  const { error: uploadError } = await supabase.storage
    .from(FILES_BUCKET)
    .upload(storagePath, file);

  if (uploadError) {
    toast.error("Échec de l'upload");
    return null;
  }

  const { data, error } = await supabase
    .from("shared_files")
    .insert({
      storage_path: storagePath,
      file_name: file.name,
      mime_type: file.type || null,
      size_bytes: file.size,
    })
    .select()
    .single();

  if (error) {
    // Le fichier est uploadé mais la métadonnée a échoué : on nettoie pour
    // ne pas laisser un blob orphelin (jamais listé, jamais supprimable
    // depuis l'UI).
    await supabase.storage.from(FILES_BUCKET).remove([storagePath]);
    toast.error("Échec de l'enregistrement");
    return null;
  }

  toast.success("Fichier partagé !");
  return data as SharedFile;
}

export async function getDownloadUrl(storagePath: string): Promise<string | null> {
  const supabase = createClient();
  // URL signée, valable 60s : le bucket est privé, pas d'URL publique.
  // Une validité courte suffit puisqu'elle n'est générée qu'au clic sur
  // "Télécharger", pas stockée nulle part.
  const { data, error } = await supabase.storage
    .from(FILES_BUCKET)
    .createSignedUrl(storagePath, 60);

  if (error) {
    toast.error("Impossible de générer le lien de téléchargement");
    return null;
  }
  return data.signedUrl;
}

export async function deleteFile(file: Pick<SharedFile, "id" | "storage_path">): Promise<boolean> {
  const supabase = createClient();
  const { error: storageError } = await supabase.storage
    .from(FILES_BUCKET)
    .remove([file.storage_path]);

  if (storageError) {
    toast.error("Échec de la suppression du fichier");
    return false;
  }

  const { error } = await supabase.from("shared_files").delete().eq("id", file.id);
  if (error) {
    toast.error("Échec de la suppression");
    return false;
  }
  return true;
}
