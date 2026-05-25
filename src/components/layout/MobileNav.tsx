import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Search, Plus, Heart, User } from "lucide-react";

const items: Array<{ to: string; label: string; icon: typeof Home; primary?: boolean }> = [
  { to: "/", label: "Home", icon: Home },
  { to: "/search", label: "Search", icon: Search },
  { to: "/list-item", label: "List", icon: Plus, primary: true },
  { to: "/rentals", label: "Rentals", icon: Heart },
  { to: "/dashboard", label: "Me", icon: User },
];

export function MobileNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur-xl sm:hidden">
      <ul className="mx-auto grid max-w-md grid-cols-5">
        {items.map(({ to, label, icon: Icon, primary }) => {
          const active = pathname === to;
          return (
            <li key={to} className="flex">
              <Link
                to={to}
                className="flex flex-1 flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-semibold"
              >
                {primary ? (
                  <span className="-mt-7 grid h-12 w-12 place-items-center rounded-full bg-primary text-primary-foreground shadow-glow ring-4 ring-background">
                    <Icon className="h-5 w-5" />
                  </span>
                ) : (
                  <Icon className={`h-5 w-5 ${active ? "text-primary" : "text-muted-foreground"}`} />
                )}
                {!primary && <span className={active ? "text-primary" : "text-muted-foreground"}>{label}</span>}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}