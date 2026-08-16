import type { ComponentType } from "react";

/** Contrat qu'un module-outil doit respecter — PRD §12.2. Ces modules ne
 * sont plus des destinations de navigation directes : ils s'affichent en
 * onglets à l'intérieur de la page /outils (voir OutilsTabs.tsx). */
export interface Module {
  id: string;
  label: string;
  /** Composant icône (lucide-react), pas un élément déjà rendu, pour
   * pouvoir lui appliquer une className différente selon le contexte. */
  icon: ComponentType<{ className?: string }>;
  href: string;
  component: ComponentType;
  config: {
    requiresAuth?: boolean;
    requiresSupabase?: boolean;
  };
}

/** Une destination de la navigation principale (Sidebar + BottomNav).
 * Volontairement séparé de `Module` : un NavItem n'a pas de composant à
 * lui, juste un lien — "Outils" pointe vers une page qui contient
 * plusieurs modules, pas un seul. */
export interface NavItem {
  id: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  href: string;
}
