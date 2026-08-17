export default function Loading() {
  // Squelette léger, pas de logique : Next.js l'affiche automatiquement
  // (via Suspense) pendant que /outils/page.tsx se prépare côté serveur.
  return (
    <div className="flex flex-col gap-4 animate-pulse">
      <div className="h-11 w-64 bg-surface-container rounded-xl" />
      <div className="h-64 bg-surface-container rounded-xl max-w-2xl w-full mx-auto md:mx-0" />
    </div>
  );
}
