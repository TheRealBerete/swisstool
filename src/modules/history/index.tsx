"use client";

import { ClipboardCopy, History as HistoryIcon, Repeat, Trash2 } from "lucide-react";
import { Card } from "@/shared/Card";
import { Button } from "@/shared/Button";
import { Badge } from "@/shared/Badge";
import { isExpired } from "@/shared/CountdownTimer";
import { copyToClipboard } from "@/modules/clipboard/hooks";
import { useHistory } from "./hooks";

const TONE: Record<string, "neutral" | "danger"> = {
  password: "danger",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("fr-CH", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function HistoryModule() {
  const { items, loading, remove, clearAll, reshare } = useHistory();

  return (
    <Card className="flex flex-col overflow-hidden max-w-2xl mx-auto w-full">
      <div className="p-4 border-b border-outline-variant bg-surface-container-low/30 flex justify-between items-center">
        <h3 className="font-headline-sm text-headline-sm text-on-background flex items-center gap-2">
          <HistoryIcon className="w-5 h-5 text-primary" />
          Historique
        </h3>
        {items.length > 0 && (
          <Button
            variant="danger"
            className="px-4 py-1"
            onClick={() => {
              if (window.confirm("Effacer tout l'historique ? Cette action est irréversible.")) {
                clearAll();
              }
            }}
          >
            <Trash2 className="w-3.5 h-3.5" />
            Tout effacer
          </Button>
        )}
      </div>

      <div className="flex flex-col divide-y divide-outline-variant/50 max-h-[70vh] overflow-y-auto">
        {loading && (
          <p className="font-body-sm text-body-sm text-on-surface-variant p-6 text-center">
            Chargement...
          </p>
        )}
        {!loading && items.length === 0 && (
          <p className="font-body-sm text-body-sm text-on-surface-variant p-6 text-center">
            Aucun partage pour l&apos;instant.
          </p>
        )}
        {items.map((item) => {
          const expired = isExpired(item.expires_at);
          const display =
            item.type === "password" ? "•".repeat(Math.min(item.content.length, 20)) : item.content;
          return (
            <div key={item.id} className="p-4 flex items-start gap-4 group">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 mb-1 flex-wrap">
                  <Badge tone={TONE[item.type] ?? "neutral"}>{item.type}</Badge>
                  {expired && <Badge tone="muted">Expiré</Badge>}
                  <span className="font-body-sm text-[12px] text-outline ml-auto">
                    {formatDate(item.created_at)}
                  </span>
                </div>
                <p className="font-mono text-body-sm text-on-background truncate">{display}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  title="Copier"
                  onClick={() => copyToClipboard(item.content)}
                  className="p-1 rounded text-on-surface-variant hover:text-primary hover:bg-surface-container-low transition-colors"
                >
                  <ClipboardCopy className="w-4 h-4" />
                </button>
                <button
                  title="Repartager"
                  onClick={() => reshare(item)}
                  className="p-1 rounded text-on-surface-variant hover:text-primary hover:bg-surface-container-low transition-colors"
                >
                  <Repeat className="w-4 h-4" />
                </button>
                <button
                  title="Supprimer"
                  onClick={() => remove(item.id)}
                  className="p-1 rounded text-on-surface-variant hover:text-error hover:bg-error-container/20 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
