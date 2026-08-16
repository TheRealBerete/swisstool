import type { ReactNode } from "react";
import { Suspense } from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { BottomNav } from "./BottomNav";
import { PasteUploadListener } from "./PasteUploadListener";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col md:flex-row">
      <Sidebar />
      <main className="flex-1 md:ml-64 flex flex-col min-h-screen pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-0">
        {/* Suspense requis par Next.js : TopBar lit useSearchParams() (pour
            afficher l'onglet actif de /outils dans le titre), et ce hook
            doit toujours être encadré d'un Suspense côté App Router. */}
        <Suspense fallback={null}>
          <TopBar />
        </Suspense>
        <div className="p-4 md:p-gutter max-w-[1120px] mx-auto w-full flex-1">
          {children}
        </div>
      </main>
      <BottomNav />
      {/* Écoute globale : coller une image (Ctrl+V) n'importe où dans
          l'appli l'envoie directement au module Fichiers. */}
      <PasteUploadListener />
    </div>
  );
}
