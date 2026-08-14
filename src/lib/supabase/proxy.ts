import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Rafraîchit la session Supabase à chaque requête et protège les routes
 * de l'app derrière l'authentification.
 *
 * Pourquoi dans le proxy (et pas juste dans chaque page) : le token
 * d'accès Supabase expire au bout d'1h. Le proxy tourne AVANT le rendu de
 * chaque page, donc c'est l'endroit le plus fiable pour vérifier/rafraîchir
 * la session avant que la page essaie de lire des données protégées par RLS.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // getClaims() vérifie le JWT localement (rapide, pas d'appel réseau sauf
  // si le token est expiré et doit être rafraîchi). Préférable à getSession()
  // qui fait confiance aveuglément aux cookies sans les valider.
  const { data } = await supabase.auth.getClaims();
  const isAuthenticated = !!data?.claims;

  const { pathname } = request.nextUrl;
  const isLoginPage = pathname.startsWith("/login");

  if (!isAuthenticated && !isLoginPage) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthenticated && isLoginPage) {
    const homeUrl = request.nextUrl.clone();
    homeUrl.pathname = "/clipboard";
    homeUrl.search = "";
    return NextResponse.redirect(homeUrl);
  }

  return response;
}
