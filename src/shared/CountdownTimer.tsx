"use client";

import { useEffect, useState } from "react";

function formatRemaining(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

interface CountdownTimerProps {
  expiresAt: string; // ISO timestamp
  onExpire?: () => void;
  className?: string;
}

/**
 * Affiche le temps restant avant expiration (format MM:SS, PRD §5.4).
 * Le calcul se fait côté client à partir de `expires_at` — pas besoin
 * d'interroger le serveur à chaque tick, juste comparer à l'horloge locale.
 */
export function CountdownTimer({ expiresAt, onExpire, className = "" }: CountdownTimerProps) {
  const [remaining, setRemaining] = useState(
    () => new Date(expiresAt).getTime() - Date.now()
  );

  useEffect(() => {
    const tick = () => {
      const next = new Date(expiresAt).getTime() - Date.now();
      setRemaining(next);
      if (next <= 0) onExpire?.();
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [expiresAt, onExpire]);

  if (remaining <= 0) {
    return <span className={className}>Expiré</span>;
  }

  return <span className={className}>{formatRemaining(remaining)}</span>;
}

export function isExpired(expiresAt: string): boolean {
  return new Date(expiresAt).getTime() <= Date.now();
}
