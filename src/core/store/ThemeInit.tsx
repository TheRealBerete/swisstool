"use client";

import { useEffect } from "react";
import { applyThemeClass, useThemeStore } from "./useThemeStore";

/**
 * Composant "silencieux" (ne rend rien) monté une fois dans le layout
 * racine. Il synchronise la classe .dark du <html> avec le store Zustand
 * dès l'hydratation, puis à chaque changement de thème.
 */
export function ThemeInit() {
  const theme = useThemeStore((state) => state.theme);

  useEffect(() => {
    applyThemeClass(theme);
  }, [theme]);

  return null;
}
