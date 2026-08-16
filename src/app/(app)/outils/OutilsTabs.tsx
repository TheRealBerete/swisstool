"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { tools } from "@/core/registry/modules";

const TOOL_IDS = tools.map((tool) => tool.id);
const DEFAULT_TOOL = tools[0].id;

export function OutilsTabs({ initialTool }: { initialTool?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // L'URL (?tool=...) est la source de vérité une fois la page hydratée —
  // `initialTool` (venu du Server Component) ne sert qu'au tout premier
  // rendu, avant que useSearchParams() ait quoi que ce soit à lire.
  const requested = searchParams.get("tool") ?? initialTool;
  const activeId = requested && TOOL_IDS.includes(requested) ? requested : DEFAULT_TOOL;
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
              onClick={() => router.push(tool.href, { scroll: false })}
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
