import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Client Supabase pour le serveur (Server Components, Server Actions,
 * Route Handlers). Lit/écrit la session via les cookies de la requête.
 *
 * ⚠️ À appeler à chaque requête (jamais mis en cache dans une variable
 * globale) car il est lié aux cookies de LA requête en cours.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // `set` appelé depuis un Server Component (pas une Server
            // Action / Route Handler) : on ne peut pas écrire de cookie ici.
            // Sans conséquence tant que le proxy (src/proxy.ts) rafraîchit
            // la session à chaque requête.
          }
        },
      },
    }
  );
}
