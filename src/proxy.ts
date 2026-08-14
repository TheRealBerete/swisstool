import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Le proxy tourne sur toutes les routes SAUF les fichiers statiques,
     * l'optimisation d'images et les assets publics (sinon il bloquerait
     * le chargement du CSS/JS/icônes en plus de gérer l'auth). Le
     * manifest PWA en particulier DOIT rester public : c'est le
     * navigateur/l'OS qui le récupère (prompt "Ajouter à l'écran
     * d'accueil"), jamais dans un contexte authentifié.
     */
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|.*\\.png$|.*\\.svg$).*)",
  ],
};
