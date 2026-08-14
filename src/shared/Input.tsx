import type { InputHTMLAttributes, LabelHTMLAttributes, TextareaHTMLAttributes } from "react";

export function Label(props: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-1 block"
      {...props}
    />
  );
}

const fieldClasses =
  "w-full bg-surface-container-lowest border border-outline/30 rounded text-body-md text-body-md text-on-background px-4 py-2 focus:outline-none focus:border-primary focus:border-2 transition-colors";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={fieldClasses} {...props} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`${fieldClasses} resize-none`} {...props} />;
}
