import type { ComponentType } from "react";

/** Contrat qu'un module doit respecter — PRD §12.2. */
export interface Module {
  id: string;
  label: string;
  /** Composant icône (lucide-react), pas un élément déjà rendu, pour
   * pouvoir lui appliquer une className différente selon le contexte
   * (Sidebar desktop vs BottomNav mobile). */
  icon: ComponentType<{ className?: string }>;
  href: string;
  component: ComponentType;
  config: {
    requiresAuth?: boolean;
    requiresSupabase?: boolean;
  };
}
