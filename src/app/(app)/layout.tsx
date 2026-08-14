import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/core/layout/AppShell";

/**
 * Le proxy (src/proxy.ts) redirige déjà les visiteurs non connectés vers
 * /login. Cette vérification-ci est redondante en apparence, mais c'est
 * la bonne pratique recommandée par Next.js : ne jamais faire confiance
 * uniquement au proxy pour l'auth, toujours revérifier au plus près des
 * données (ici, juste avant de rendre les pages protégées).
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims) {
    redirect("/login");
  }

  return <AppShell>{children}</AppShell>;
}
