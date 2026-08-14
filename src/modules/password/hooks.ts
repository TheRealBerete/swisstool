"use client";

import { useCallback, useState } from "react";
import { eventBus } from "@/core/services/eventBus";
import { shareToClipboard } from "@/core/services/clipboardApi";
import { toast } from "@/core/store/useToastStore";
import { storage, STORAGE_KEYS } from "@/core/services/storage";
import { DEFAULT_PASSWORD_OPTIONS, type PasswordOptions } from "./types";

const CHARSETS: Record<keyof Omit<PasswordOptions, "length">, string> = {
  uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lowercase: "abcdefghijklmnopqrstuvwxyz",
  numbers: "0123456789",
  symbols: "!@#$%^&*()-_=+[]{};:,.<>?",
};

/**
 * Tire un entier uniforme dans [0, maxExclusive) à partir de
 * crypto.getRandomValues, SANS biais de modulo.
 *
 * 🧠 Biais de modulo : `randomUint32 % n` favorise légèrement les petites
 * valeurs quand n ne divise pas exactement 2^32 (ex: avec un alphabet de
 * 70 caractères, certains sont tirés un peu plus souvent que d'autres).
 * Négligeable pour l'UX, mais pas pour un générateur qui se veut
 * "robuste" (PRD §5.2) — on rejette les tirages hors de la zone uniforme
 * et on retire, une pratique standard en génération cryptographique.
 */
function randomInt(maxExclusive: number): number {
  const maxUnbiased = Math.floor(0xffffffff / maxExclusive) * maxExclusive;
  const buf = new Uint32Array(1);
  let value: number;
  do {
    crypto.getRandomValues(buf);
    value = buf[0];
  } while (value >= maxUnbiased);
  return value % maxExclusive;
}

function randomChar(pool: string): string {
  return pool[randomInt(pool.length)];
}

export function generatePassword(options: PasswordOptions): string {
  const pools = (Object.keys(CHARSETS) as (keyof typeof CHARSETS)[])
    .filter((key) => options[key])
    .map((key) => CHARSETS[key]);

  if (pools.length === 0 || options.length < pools.length) return "";

  const alphabet = pools.join("");
  const chars: string[] = [];

  // 1) Un caractère garanti par type coché, sinon un mot de passe pourrait
  //    par pur hasard ne contenir aucun chiffre alors que "chiffres" est coché.
  for (const pool of pools) chars.push(randomChar(pool));
  // 2) Le reste tiré librement dans l'alphabet combiné.
  for (let i = chars.length; i < options.length; i++) chars.push(randomChar(alphabet));
  // 3) Mélange (Fisher-Yates) pour ne pas toujours placer les caractères
  //    garantis en tête du mot de passe.
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }

  return chars.join("");
}

export function usePasswordGenerator() {
  const [options, setOptions] = useState<PasswordOptions>(DEFAULT_PASSWORD_OPTIONS);
  const [password, setPassword] = useState("");

  const generate = useCallback(() => {
    const atLeastOneType =
      options.uppercase || options.lowercase || options.numbers || options.symbols;
    if (!atLeastOneType) {
      toast.error("Coche au moins un type de caractère");
      return;
    }
    const next = generatePassword(options);
    setPassword(next);
    // Historique local optionnel (PRD §5.2) — jamais envoyé à Supabase.
    const history = storage.get<string[]>(STORAGE_KEYS.passwordHistory, []);
    storage.set(STORAGE_KEYS.passwordHistory, [next, ...history].slice(0, 20));
  }, [options]);

  const share = useCallback(async () => {
    if (!password) return;
    eventBus.emit("password:generated", { password });
    await shareToClipboard(password, "password");
  }, [password]);

  return { options, setOptions, password, generate, share };
}
