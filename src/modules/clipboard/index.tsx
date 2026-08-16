"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { ClipboardCopy, Link2, Lock, Send, Type } from "lucide-react";
import { Card } from "@/shared/Card";
import { Button } from "@/shared/Button";
import { Textarea } from "@/shared/Input";
import { Badge } from "@/shared/Badge";
import { CountdownTimer, isExpired } from "@/shared/CountdownTimer";
import { copyToClipboard, useSharedClipboard } from "./hooks";
import type { ClipboardItemType } from "./types";

const TYPE_OPTIONS: { value: ClipboardItemType; label: string; icon: typeof Type }[] = [
  { value: "text", label: "Texte", icon: Type },
  { value: "link", label: "Lien", icon: Link2 },
  { value: "password", label: "Secret", icon: Lock },
];

// Un QR code perd en fiabilité de scan bien avant sa limite technique —
// au-delà de ce seuil de caractères, on encode un LIEN vers la page de
// lecture (/clipboard/[id]) plutôt que le texte brut : le QR reste petit
// et scannable, et l'appareil qui scanne affiche le texte complet une
// fois la page ouverte (voir ClipboardItemView.tsx).
const QR_RAW_THRESHOLD = 300;

export function ClipboardModule() {
  const { latest, loading, shareText } = useSharedClipboard();
  const [content, setContent] = useState("");
  const [type, setType] = useState<ClipboardItemType>("text");
  const [sharing, setSharing] = useState(false);

  async function handleShare() {
    setSharing(true);
    const ok = await shareText(content, type);
    setSharing(false);
    if (ok) setContent("");
  }

  const activeItem = latest && !isExpired(latest.expires_at) ? latest : null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
      <section className="md:col-span-7 flex flex-col gap-4">
        <Card className="p-6 flex flex-col gap-4">
          <h3 className="font-headline-sm text-headline-sm text-on-background">
            Nouveau partage
          </h3>
          <div className="flex gap-1">
            {TYPE_OPTIONS.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setType(value)}
                className={`flex items-center gap-1 px-4 py-1 rounded font-label-md text-label-md transition-colors ${
                  type === value
                    ? "bg-primary text-on-primary"
                    : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>
          <Textarea
            rows={4}
            placeholder="Colle ou écris ce que tu veux partager..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <Button
            onClick={handleShare}
            disabled={sharing || !content.trim()}
            className="self-end"
          >
            <Send className="w-3.5 h-3.5" />
            Partager
          </Button>
        </Card>
      </section>

      <section className="md:col-span-5 flex flex-col gap-4">
        <Card className="flex flex-col overflow-hidden">
          <div className="p-4 border-b border-outline-variant bg-surface-container-low/30">
            <h3 className="font-headline-sm text-headline-sm text-on-background">
              Partage actif
            </h3>
          </div>
          <div className="p-6 flex flex-col items-center gap-4">
            {loading ? (
              <p className="font-body-sm text-body-sm text-on-surface-variant py-6">
                Chargement...
              </p>
            ) : !activeItem ? (
              <p className="font-body-sm text-body-sm text-on-surface-variant py-6 text-center">
                Aucun partage actif pour l&apos;instant.
              </p>
            ) : (
              <>
                <div className="flex items-center gap-2 self-start">
                  <Badge tone={activeItem.type === "password" ? "danger" : "neutral"}>
                    {activeItem.type}
                  </Badge>
                  <CountdownTimer
                    expiresAt={activeItem.expires_at}
                    className="font-mono text-body-sm text-outline ml-auto"
                  />
                </div>
                <p className="font-body-md text-body-md text-on-background break-all text-center bg-surface-container-low rounded-lg px-4 py-2 w-full line-clamp-6">
                  {activeItem.type === "password"
                    ? "•".repeat(Math.min(activeItem.content.length, 24))
                    : activeItem.content}
                </p>
                <div className="bg-white p-2 rounded-lg">
                  <QRCodeSVG
                    value={
                      activeItem.content.length > QR_RAW_THRESHOLD
                        ? `${window.location.origin}/clipboard/${activeItem.id}`
                        : activeItem.content
                    }
                    size={160}
                  />
                </div>
                {activeItem.content.length > QR_RAW_THRESHOLD && (
                  <p className="font-body-sm text-body-sm text-on-surface-variant text-center -mt-2">
                    Texte long : le QR ouvre la page de lecture plutôt que de l&apos;encoder
                    directement.
                  </p>
                )}
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => copyToClipboard(activeItem.content)}
                >
                  <ClipboardCopy className="w-3.5 h-3.5" />
                  Copier sur cet appareil
                </Button>
              </>
            )}
          </div>
        </Card>
      </section>
    </div>
  );
}
