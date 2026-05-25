import { Link, useNavigate } from "@tanstack/react-router";
import { Search, ShoppingCart, Sun, Moon, User, LogOut, LayoutDashboard, Heart, Plus, MapPin, ChevronDown, SlidersHorizontal } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LocationPicker } from "./LocationPicker";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";
import { useCart } from "@/hooks/use-cart";

export function Header() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { theme, toggle } = useTheme();
  const { count } = useCart();
  const [q, setQ] = useState("");

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    if (!q.trim()) return;
    navigate({ to: "/search", search: { q: q.trim() } as never });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur-xl">
      {/* Top row */}
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 pt-3 pb-2 sm:gap-5 lg:px-6">
        <Link to="/" className="flex items-center gap-1.5">
          <span className="font-display text-2xl font-extrabold tracking-tight text-primary">
            Rentify
          </span>
          <span className="rounded bg-primary px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-primary-foreground">
            BETA
          </span>
        </Link>

        <div className="hidden md:block">
          <LocationPicker />
        </div>

        <div className="ml-auto flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme" className="rounded-full">
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>

          <Link to="/list-item" className="hidden sm:inline-flex">
            <Button size="sm" className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="mr-1 h-4 w-4" /> List item
            </Button>
          </Link>

          <Link to="/cart" className="relative">
            <Button variant="ghost" size="icon" className="rounded-full" aria-label="Cart">
              <ShoppingCart className="h-5 w-5" />
            </Button>
            {count > 0 && (
              <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                {count}
              </span>
            )}
          </Link>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full p-0" aria-label="Account">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-accent text-sm font-bold text-primary-foreground shadow-glow">
                    {(user.email ?? "U").slice(0, 1).toUpperCase()}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="truncate">{user.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate({ to: "/dashboard" })}>
                  <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate({ to: "/rentals" })}>
                  <Heart className="mr-2 h-4 w-4" /> My rentals
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut().then(() => navigate({ to: "/" }))}>
                  <LogOut className="mr-2 h-4 w-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to="/login">
              <Button size="sm" className="rounded-full">Sign in</Button>
            </Link>
          )}
        </div>
      </div>

      {/* Search row */}
      <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 pb-3 lg:px-6">
        <form onSubmit={onSearch} className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search items to rent or buy…"
            className="h-11 rounded-xl border-2 border-border bg-muted/60 pl-11 pr-4 text-sm focus-visible:border-primary focus-visible:bg-background"
          />
        </form>
        <Link to="/search">
          <Button size="icon" className="h-11 w-11 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90">
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      <div className="border-t border-border/60 px-4 py-2 md:hidden">
        <LocationPicker compact />
      </div>
    </header>
  );
}