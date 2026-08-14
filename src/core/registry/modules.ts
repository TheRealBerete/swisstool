import { ClipboardList, FolderUp, History, KeyRound } from "lucide-react";
import { ClipboardModule } from "@/modules/clipboard";
import { PasswordModule } from "@/modules/password";
import { HistoryModule } from "@/modules/history";
import { FilesModule } from "@/modules/files";
import type { Module } from "./types";

/**
 * Registre central des modules — PRD §4 "Architecture plug-in". Ajouter un
 * futur module (convertisseur, notes...) = créer son dossier dans
 * `src/modules/`, l'enregistrer ici, ajouter sa route dans
 * `src/app/(app)/`. La nav (Sidebar/BottomNav) lit cette liste, elle n'a
 * jamais besoin d'être modifiée à la main.
 */
export const modules: Module[] = [
  {
    id: "clipboard",
    label: "Presse-papier",
    icon: ClipboardList,
    href: "/clipboard",
    component: ClipboardModule,
    config: { requiresAuth: true, requiresSupabase: true },
  },
  {
    id: "password",
    label: "Générateur MDP",
    icon: KeyRound,
    href: "/password",
    component: PasswordModule,
    config: { requiresAuth: true, requiresSupabase: false },
  },
  {
    id: "history",
    label: "Historique",
    icon: History,
    href: "/history",
    component: HistoryModule,
    config: { requiresAuth: true, requiresSupabase: true },
  },
  {
    id: "files",
    label: "Fichiers",
    icon: FolderUp,
    href: "/files",
    component: FilesModule,
    config: { requiresAuth: true, requiresSupabase: true },
  },
];
