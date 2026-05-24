import { Link } from "@tanstack/react-router";
import { iconFor } from "@/lib/categories";

export function CategoryTile({
  slug, name, icon,
}: { slug: string; name: string; icon: string | null }) {
  const Icon = iconFor(icon);
  return (
    <Link
      to="/category/$slug"
      params={{ slug }}
      className="group flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-4 text-center transition hover:-translate-y-0.5 hover:border-secondary hover:shadow-soft"
    >
      <span className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-accent/15 text-secondary transition group-hover:bg-gradient-accent group-hover:text-primary-foreground">
        <Icon className="h-6 w-6" />
      </span>
      <span className="text-xs font-semibold leading-tight">{name}</span>
    </Link>
  );
}