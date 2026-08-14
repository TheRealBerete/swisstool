import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    "bg-primary text-on-primary hover:bg-on-primary-fixed-variant disabled:opacity-40",
  secondary:
    "border border-primary text-primary hover:bg-primary/10 disabled:opacity-40",
  ghost:
    "text-on-surface-variant hover:bg-surface-container-low disabled:opacity-40",
  danger:
    "border border-error text-error hover:bg-error/10 disabled:opacity-40",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 px-6 py-2 rounded-lg font-label-md text-label-md transition-colors active:opacity-80 disabled:cursor-not-allowed ${VARIANT_CLASSES[variant]} ${className}`}
      {...props}
    />
  );
}
