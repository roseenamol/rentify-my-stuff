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
      className="group flex min-w-[72px] flex-col items-center gap-1.5 rounded-2xl border-[1.5px] border-border bg-card px-2 py-3 text-center transition hover:border-primary hover:bg-accent active:scale-95"
    >
      <span className="grid h-10 w-10 place-items-center rounded-xl text-primary transition group-hover:scale-110">
        <Icon className="h-6 w-6" />
      </span>
      <span className="text-[11px] font-semibold leading-tight text-muted-foreground group-hover:text-primary">
        {name}
      </span>
    </Link>
  );
}