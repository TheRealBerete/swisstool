"use client";

import { ClipboardCopy, KeyRound, RefreshCw, Send } from "lucide-react";
import { Card } from "@/shared/Card";
import { Button } from "@/shared/Button";
import { Label } from "@/shared/Input";
import { copyToClipboard } from "@/modules/clipboard/hooks";
import { usePasswordGenerator } from "./hooks";
import type { PasswordOptions } from "./types";

const TOGGLES: { key: keyof Omit<PasswordOptions, "length">; label: string }[] = [
  { key: "uppercase", label: "Majuscules (A-Z)" },
  { key: "lowercase", label: "Minuscules (a-z)" },
  { key: "numbers", label: "Chiffres (0-9)" },
  { key: "symbols", label: "Symboles (!@#...)" },
];

export function PasswordModule() {
  const { options, setOptions, password, generate, share } = usePasswordGenerator();

  return (
    <div className="max-w-xl mx-auto w-full flex flex-col gap-4">
      <Card className="p-6 flex flex-col gap-6">
        <h3 className="font-headline-sm text-headline-sm text-on-background flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-primary" />
          Générateur de mots de passe
        </h3>

        <div>
          <Label htmlFor="length">Longueur — {options.length} caractères</Label>
          <input
            id="length"
            type="range"
            min={4}
            max={64}
            value={options.length}
            onChange={(e) =>
              setOptions((prev) => ({ ...prev, length: Number(e.target.value) }))
            }
            className="w-full accent-primary"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          {TOGGLES.map(({ key, label }) => (
            <label
              key={key}
              className="flex items-center gap-2 font-body-sm text-body-sm text-on-surface-variant cursor-pointer"
            >
              <input
                type="checkbox"
                checked={options[key]}
                onChange={(e) =>
                  setOptions((prev) => ({ ...prev, [key]: e.target.checked }))
                }
                className="accent-primary w-4 h-4"
              />
              {label}
            </label>
          ))}
        </div>

        <Button onClick={generate} className="w-full">
          <RefreshCw className="w-3.5 h-3.5" />
          Générer
        </Button>

        {password && (
          <div className="flex flex-col gap-2">
            <p className="font-mono text-body-lg text-on-background bg-surface-container-low rounded-lg px-4 py-2 break-all text-center">
              {password}
            </p>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => copyToClipboard(password)}
              >
                <ClipboardCopy className="w-3.5 h-3.5" />
                Copier
              </Button>
              <Button className="flex-1" onClick={share}>
                <Send className="w-3.5 h-3.5" />
                Partager
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
