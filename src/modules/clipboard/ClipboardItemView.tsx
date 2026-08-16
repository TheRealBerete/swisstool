"use client";

import Link from "next/link";
import { ArrowLeft, ClipboardCopy } from "lucide-react";
import { Card } from "@/shared/Card";
import { Button } from "@/shared/Button";
import { Badge } from "@/shared/Badge";
import { CountdownTimer, isExpired } from "@/shared/CountdownTimer";
import { copyToClipboard } from "./hooks";
import type { ClipboardItem } from "./types";

export function ClipboardItemView({ item }: { item: ClipboardItem }) {
  const expired = isExpired(item.expires_at);

  return (
    <div className="max-w-2xl mx-auto w-full flex flex-col gap-4">
      <Link
        href="/outils?tool=clipboard"
        className="inline-flex items-center gap-1 text-on-surface-variant hover:text-primary transition-colors font-label-md text-label-md w-fit"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour au presse-papier
      </Link>

      <Card className="flex flex-col overflow-hidden">
        <div className="p-4 border-b border-outline-variant bg-surface-container-low/30 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Badge tone={item.type === "password" ? "danger" : "neutral"}>{item.type}</Badge>
            {expired && <Badge tone="muted">Expiré</Badge>}
          </div>
          <CountdownTimer expiresAt={item.expires_at} className="font-mono text-body-sm text-outline" />
        </div>

        <div className="p-6 flex flex-col gap-4">
          <p className="font-body-md text-body-md text-on-background whitespace-pre-wrap break-words">
            {item.content}
          </p>
          <Button
            variant="secondary"
            className="w-full"
            disabled={expired}
            onClick={() => copyToClipboard(item.content)}
          >
            <ClipboardCopy className="w-3.5 h-3.5" />
            Copier sur cet appareil
          </Button>
        </div>
      </Card>
    </div>
  );
}
