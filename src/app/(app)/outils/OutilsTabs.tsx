"use client";

import { useOptimistic, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { tools } from "@/core/registry/modules";

const TOOL_IDS = tools.map((tool) => tool.id);
const DEFAULT_TOOL = tools[0].id;

function resolveTool(id: string | null | undefined): string {
  return id && TOOL_IDS.includes(id) ? id : DEFAULT_TOOL;
}

export function OutilsTabs({ initialTool }: { initialTool?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  // L'URL (?tool=...) reste la source de vérité (committedId). Mais on ne
  // veut pas ATTENDRE qu'elle finisse de se resynchroniser côté serveur
  // avant d'afficher l'onglet choisi — useOptimistic affiche `activeId`
  // tout de suite au clic, et React revient tout seul à `committedId` dès
  // que celui-ci rattrape la valeur optimiste (pas de setState manuel à
  // range/nettoyer dans un effect). C'est la fonctionnalité React 19
  // pensée exactement pour ce cas : "affiche déjà le résultat pendant
  // qu'une action est encore en cours derrière".
  const committedId = resolveTool(searchParams.get("tool") ?? initialTool);
  const [activeId, setOptimisticId] = useOptimistic(committedId);

  function select(id: string) {
    if (id === activeId) return;
    startTransition(() => {
      setOptimisticId(id);
      router.replace(`/outils?tool=${id}`, { scroll: false });
    });
  }

  const ActiveTool = tools.find((tool) => tool.id === activeId)?.component ?? tools[0].component;

  return (
    <div className="flex flex-col gap-4">
      {/* Contrôle segmenté : équivalent d'onglets, pattern standard pour
          basculer entre vues liées sans changer de destination de nav. */}
      <div className="flex gap-1 bg-surface-container p-1 rounded-xl w-fit mx-auto md:mx-0">
        {tools.map((tool) => {
          const Icon = tool.icon;
          const active = tool.id === activeId;
          return (
            <button
              key={tool.id}
              onClick={() => select(tool.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-label-md text-label-md transition-colors ${
                active
                  ? "bg-surface-container-lowest text-primary shadow-sm"
                  : "text-on-surface-variant hover:text-on-background"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tool.label}</span>
            </button>
          );
        })}
      </div>

      <ActiveTool />
    </div>
  );
}
