"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export type ChangePasswordState = {
  error: string | null;
  success: boolean;
};

/**
 * Changer le mot de passe d'un compte déjà connecté. Contrairement au flux
 * "mot de passe oublié" (lien envoyé par email), ici la session en cours
 * (cookie déjà validé par le proxy pour accéder à /settings) suffit comme
 * preuve d'identité — c'est le comportement standard de
 * `auth.updateUser()` côté Supabase, pas besoin de redemander l'ancien
 * mot de passe.
 */
export async function changePassword(
  _prevState: ChangePasswordState,
  formData: FormData
): Promise<ChangePasswordState> {
  const password = formData.get("password") as string;
  const confirm = formData.get("confirm") as string;

  if (!password || password.length < 8) {
    return { error: "8 caractères minimum.", success: false };
  }
  if (password !== confirm) {
    return { error: "Les deux mots de passe ne correspondent pas.", success: false };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { error: "Échec du changement de mot de passe. Réessaie.", success: false };
  }

  return { error: null, success: true };
}
