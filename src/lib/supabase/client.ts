import { createBrowserClient } from "@supabase/ssr";

/**
 * Client Supabase pour le navigateur (composants "use client").
 * Utilise localStorage/cookies automatiquement pour la session — pas besoin
 * de gérer les cookies à la main ici, @supabase/ssr s'en charge.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
