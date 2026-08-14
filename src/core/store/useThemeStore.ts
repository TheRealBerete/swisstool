import { create } from "zustand";
import { persist } from "zustand/middleware";

type Theme = "light" | "dark";

type ThemeState = {
  theme: Theme;
  toggle: () => void;
  setTheme: (theme: Theme) => void;
};

/**
 * 🧠 Zustand : une petite librairie de state global. Contrairement au
 * Context React, un composant qui lit `useThemeStore` ne re-render QUE
 * quand `theme` change — pas à chaque changement d'un autre state du store.
 * `persist` sauvegarde automatiquement la valeur dans localStorage pour
 * garder le thème choisi d'une visite à l'autre.
 */
export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: "light",
      toggle: () => set({ theme: get().theme === "light" ? "dark" : "light" }),
      setTheme: (theme) => set({ theme }),
    }),
    { name: "swisstool-theme" }
  )
);

/** Applique/retire la classe .dark sur <html> en fonction du store. */
export function applyThemeClass(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
}
