"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItems } from "@/core/registry/modules";

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 w-full flex justify-around items-center px-4 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] bg-surface dark:bg-surface-dim border-t border-outline-variant z-50">
      {navItems.map(({ href, label, icon: Icon }) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center justify-center rounded-xl px-6 py-1 active:scale-95 transition-transform ${
              active
                ? "bg-secondary-container dark:bg-tertiary-container text-on-secondary-container dark:text-on-tertiary-container"
                : "text-on-surface-variant"
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="font-label-md text-label-md text-[10px] mt-1">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
