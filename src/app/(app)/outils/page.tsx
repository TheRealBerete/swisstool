import { Suspense } from "react";
import { OutilsTabs } from "./OutilsTabs";

/**
 * Page hub des 3 outils (Presse-papier / Générateur MDP / Fichiers).
 * `searchParams` est une Promise même dans un Server Component sous
 * Next.js 16 (breaking change de cette version) — on l'attend ici puis on
 * passe l'onglet demandé au switcher client, qui gère ensuite les clics
 * et synchronise l'URL (?tool=...) pour que le choix reste partageable /
 * navigable au bouton retour.
 */
export default async function OutilsPage({
  searchParams,
}: {
  searchParams: Promise<{ tool?: string }>;
}) {
  const { tool } = await searchParams;
  return (
    // Suspense requis par Next.js : OutilsTabs lit useSearchParams().
    <Suspense fallback={null}>
      <OutilsTabs initialTool={tool} />
    </Suspense>
  );
}
