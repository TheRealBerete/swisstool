"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings } from "lucide-react";
import { modules } from "@/core/registry/modules";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <nav className="hidden md:flex flex-col gap-2 p-4 bg-surface-container-low dark:bg-surface-container h-screen w-64 fixed left-0 top-0 border-r border-outline-variant z-10">
      <div className="mb-6 px-2">
        <div className="flex items-center gap-2 mb-1">
          <Image
            src="/swisstool_icon_clean.png"
            alt="SwissTool"
            width={32}
            height={32}
            className="rounded"
          />
          <h1 className="font-headline-md text-headline-md font-bold text-primary">
            SwissTool
          </h1>
        </div>
        <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
          Precision Utility
        </p>
      </div>

      <div className="flex flex-col gap-1 flex-1">
        {modules.map((mod) => {
          const active = pathname.startsWith(mod.href);
          const Icon = mod.icon;
          return (
            <Link
              key={mod.id}
              href={mod.href}
              className={`flex items-center gap-2 py-2 px-4 rounded-l-lg transition-all duration-200 ${
                active
                  ? "text-primary dark:text-primary-fixed-dim font-bold border-r-2 border-primary bg-secondary-container dark:bg-on-secondary-fixed-variant"
                  : "text-on-surface-variant hover:bg-secondary-container dark:hover:bg-on-secondary-fixed-variant"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-label-md text-label-md">{mod.label}</span>
            </Link>
          );
        })}
      </div>

      <div className="mt-auto">
        <Link
          href="/settings"
          className="flex items-center gap-2 py-2 px-4 text-on-surface-variant hover:bg-secondary-container dark:hover:bg-on-secondary-fixed-variant transition-all duration-200 rounded-l-lg"
        >
          <Settings className="w-5 h-5" />
          <span className="font-label-md text-label-md">Paramètres</span>
        </Link>
      </div>
    </nav>
  );
}
