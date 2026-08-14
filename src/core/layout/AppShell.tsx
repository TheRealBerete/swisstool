import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { BottomNav } from "./BottomNav";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col md:flex-row">
      <Sidebar />
      <main className="flex-1 md:ml-64 flex flex-col min-h-screen pb-20 md:pb-0">
        <TopBar />
        <div className="p-4 md:p-gutter max-w-[1120px] mx-auto w-full flex-1">
          {children}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
