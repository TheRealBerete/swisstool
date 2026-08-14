import type { HTMLAttributes } from "react";

export function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`bg-surface-container-lowest border border-outline-variant rounded-xl ${className}`}
      {...props}
    />
  );
}

export function CardHeader({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`p-4 border-b border-outline-variant flex justify-between items-center bg-surface-container-low/30 rounded-t-xl ${className}`}
      {...props}
    />
  );
}
