import type { HTMLAttributes } from "react";

type Tone = "neutral" | "danger" | "muted";

const TONE_CLASSES: Record<Tone, string> = {
  neutral: "bg-surface-container-highest text-on-surface-variant",
  danger: "bg-error-container/40 text-error",
  muted: "bg-surface-container text-outline",
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
}

export function Badge({ tone = "neutral", className = "", ...props }: BadgeProps) {
  return (
    <span
      className={`font-label-md text-[10px] tracking-wider uppercase px-2 py-0.5 rounded ${TONE_CLASSES[tone]} ${className}`}
      {...props}
    />
  );
}
