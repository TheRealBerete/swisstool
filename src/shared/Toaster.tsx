"use client";

import { CheckCircle2, Info, XCircle } from "lucide-react";
import { useToastStore } from "@/core/store/useToastStore";

const ICONS = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
};

const VARIANT_STYLES = {
  success: "border-primary/30 text-primary",
  error: "border-error/30 text-error",
  info: "border-outline-variant text-on-surface-variant",
};

export function Toaster() {
  const toasts = useToastStore((state) => state.toasts);
  const dismiss = useToastStore((state) => state.dismiss);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-[calc(100%-2rem)] max-w-sm">
      {toasts.map((t) => {
        const Icon = ICONS[t.variant];
        return (
          <button
            key={t.id}
            onClick={() => dismiss(t.id)}
            className={`flex items-center gap-2 bg-surface-container-lowest border rounded-lg px-4 py-2 shadow-lg text-left font-body-sm text-body-sm text-on-surface ${VARIANT_STYLES[t.variant]}`}
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span className="flex-1">{t.message}</span>
          </button>
        );
      })}
    </div>
  );
}
