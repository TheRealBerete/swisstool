import { redirect } from "next/navigation";

// Le module Fichiers vit maintenant dans /outils (onglet "files").
export default function FilesPage() {
  redirect("/outils?tool=files");
}
