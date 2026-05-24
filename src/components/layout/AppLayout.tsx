import type { ReactNode } from "react";
import { Header } from "./Header";
import { MobileNav } from "./MobileNav";

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 pb-20 sm:pb-0">{children}</main>
      <footer className="hidden border-t border-border bg-muted/30 py-8 sm:block">
        <div className="mx-auto max-w-7xl px-6 text-sm text-muted-foreground">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="font-display text-base font-bold text-foreground">Rentify</p>
            <p>Rent anything, anywhere. Built for India.</p>
            <p>© {new Date().getFullYear()} Rentify</p>
          </div>
        </div>
      </footer>
      <MobileNav />
    </div>
  );
}