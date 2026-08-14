"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { Moon, Sun } from "lucide-react";
import { modules } from "@/core/registry/modules";
import { useThemeStore } from "@/core/store/useThemeStore";

export function TopBar() {
  const pathname = usePathname();
  const theme = useThemeStore((state) => state.theme);
  const toggle = useThemeStore((state) => state.toggle);

  const currentModule = modules.find((mod) => pathname.startsWith(mod.href));
  const title = currentModule?.label ?? "Paramètres";

  return (
    <header className="flex justify-between items-center px-6 py-4 w-full top-0 sticky bg-surface dark:bg-surface-dim border-b border-outline-variant z-20">
      <div className="flex items-center gap-2 md:hidden">
        <Image
          src="/swisstool_icon_clean.png"
          alt="SwissTool"
          width={28}
          height={28}
          className="rounded"
        />
        <h1 className="font-headline-lg-mobile text-headline-lg-mobile font-bold text-primary dark:text-primary-fixed-dim">
          SwissTool
        </h1>
      </div>
      <div className="hidden md:block">
        <h2 className="font-headline-sm text-headline-sm text-on-background">{title}</h2>
      </div>
      <button
        onClick={toggle}
        aria-label="Changer de thème"
        className="p-1 rounded-full text-on-surface-variant hover:bg-surface-container-low transition-colors active:opacity-80"
      >
        {theme === "light" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
      </button>
    </header>
  );
}
