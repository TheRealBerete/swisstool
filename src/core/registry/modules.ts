import { ClipboardList, Film, FolderUp, History, KeyRound, Settings, Wrench } from "lucide-react";
import { ClipboardModule } from "@/modules/clipboard";
import { PasswordModule } from "@/modules/password";
import { FilesModule } from "@/modules/files";
import { DownloaderModule } from "@/modules/downloader";
import type { Module, NavItem } from "./types";

/**
 * Deux registres distincts — PRD §4 "Architecture plug-in" :
 *
 * - `tools` : les modules concrets (Presse-papier, Générateur, Fichiers).
 *   Ils ne sont plus des routes de premier niveau ; ils s'affichent en
 *   onglets à l'intérieur de la page /outils (voir app/(app)/outils/).
 * - `navItems` : les 3 destinations de la navigation principale
 *   (Sidebar desktop + BottomNav mobile). Limité à 3 volontairement
 *   (décision utilisateur, écran mobile trop chargé à 5 boutons) : Outils
 *   regroupe les modules, Historique et Paramètres restent des pages à
 *   part entière.
 *
 * Ajouter un futur outil (convertisseur, notes...) = créer son dossier
 * dans `src/modules/`, l'enregistrer dans `tools` ci-dessous. Il apparaît
 * automatiquement comme onglet dans /outils, sans toucher à la nav.
 */
export const tools: Module[] = [
  {
    id: "clipboard",
    label: "Presse-papier",
    icon: ClipboardList,
    href: "/outils?tool=clipboard",
    component: ClipboardModule,
    config: { requiresAuth: true, requiresSupabase: true },
  },
  {
    id: "password",
    label: "Générateur MDP",
    icon: KeyRound,
    href: "/outils?tool=password",
    component: PasswordModule,
    config: { requiresAuth: true, requiresSupabase: false },
  },
  {
    id: "files",
    label: "Fichiers",
    icon: FolderUp,
    href: "/outils?tool=files",
    component: FilesModule,
    config: { requiresAuth: true, requiresSupabase: true },
  },
  {
    id: "downloader",
    label: "Vidéos",
    icon: Film,
    href: "/outils?tool=downloader",
    component: DownloaderModule,
    // requiresSupabase: false — ce module ne touche à aucune table (l'API
    // Lotus fait tout), Supabase n'intervient que si on envoie le lien
    // résultant au presse-papier partagé (déjà couvert par ce module-là).
    config: { requiresAuth: true, requiresSupabase: false },
  },
];

export const navItems: NavItem[] = [
  { id: "outils", label: "Outils", icon: Wrench, href: "/outils" },
  { id: "history", label: "Historique", icon: History, href: "/history" },
  { id: "settings", label: "Paramètres", icon: Settings, href: "/settings" },
];
