/**
 * Petit wrapper localStorage typé. Sert de repli "hors-ligne" (PRD §8.3 :
 * si Supabase est injoignable, on garde le partage en local en attendant
 * le retour du réseau) et à l'historique local des mots de passe générés.
 */
export const storage = {
  get<T>(key: string, fallback: T): T {
    if (typeof window === "undefined") return fallback;
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
      return fallback;
    }
  },
  set<T>(key: string, value: T): void {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(key, JSON.stringify(value));
  },
  remove(key: string): void {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(key);
  },
};

export const STORAGE_KEYS = {
  offlineQueue: "swisstool:offline-queue",
  passwordHistory: "swisstool:password-history",
} as const;
