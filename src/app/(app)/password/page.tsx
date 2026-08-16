import { redirect } from "next/navigation";

// Le module Générateur vit maintenant dans /outils (onglet "password").
export default function PasswordPage() {
  redirect("/outils?tool=password");
}
