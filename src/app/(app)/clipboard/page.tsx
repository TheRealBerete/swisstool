import { redirect } from "next/navigation";

// Le module Presse-papier vit maintenant dans /outils (onglet "clipboard").
// Cette route reste en place pour ne pas casser un ancien favori/lien.
export default function ClipboardPage() {
  redirect("/outils?tool=clipboard");
}
