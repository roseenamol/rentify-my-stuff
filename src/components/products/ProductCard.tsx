import { Link } from "@tanstack/react-router";
import { Star, MapPin, Truck } from "lucide-react";
import { formatINR } from "@/lib/format";

export interface ProductCardData {
  id: string;
  title: string;
  images: string[] | null;
  rent_price_day: number | null;
  sale_price: number | null;
  deposit: number | null;
  city: string | null;
  area: string | null;
  delivery_available: boolean;
  rating: number | null;
  listing_type: "rent" | "sale" | "both";
}

export function ProductCard({ p }: { p: ProductCardData }) {
  const cover = p.images?.[0];
  return (
    <Link
      to="/product/$id"
      params={{ id: p.id }}
      className="group block overflow-hidden rounded-2xl border border-border bg-card transition-all hover:-translate-y-0.5 hover:shadow-elevated"
    >
      <div className="relative aspect-square overflow-hidden bg-muted">
        {cover ? (
          <img
            src={cover}
            alt={p.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="grid h-full w-full place-items-center bg-gradient-accent/30 text-2xl font-black text-muted-foreground/40">
            {p.title.slice(0, 1)}
          </div>
        )}
        <div className="absolute left-2 top-2 flex gap-1">
          {p.listing_type !== "sale" && (
            <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
              Rent
            </span>
          )}
          {p.listing_type !== "rent" && (
            <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-secondary-foreground">
              Sale
            </span>
          )}
        </div>
        {p.delivery_available && (
          <span className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-background/90 text-secondary shadow-soft">
            <Truck className="h-3.5 w-3.5" />
          </span>
        )}
      </div>
      <div className="space-y-1.5 p-3">
        <h3 className="line-clamp-1 font-semibold leading-tight">{p.title}</h3>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3" />
          <span className="truncate">{[p.area, p.city].filter(Boolean).join(", ") || "Nearby"}</span>
        </div>
        <div className="flex items-end justify-between pt-1">
          <div>
            {p.rent_price_day != null && (
              <p className="text-base font-bold leading-none">
                {formatINR(p.rent_price_day)}
                <span className="text-xs font-normal text-muted-foreground">/day</span>
              </p>
            )}
            {p.sale_price != null && p.listing_type !== "rent" && (
              <p className="text-xs text-muted-foreground">Buy {formatINR(p.sale_price)}</p>
            )}
          </div>
          {(p.rating ?? 0) > 0 && (
            <div className="flex items-center gap-0.5 text-xs font-semibold">
              <Star className="h-3 w-3 fill-warning text-warning" />
              {Number(p.rating).toFixed(1)}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}