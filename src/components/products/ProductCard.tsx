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
      className="group block overflow-hidden rounded-2xl border border-border bg-card transition-all hover:-translate-y-0.5 hover:shadow-elevated active:scale-[0.98]"
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
          <div className="grid h-full w-full place-items-center bg-[#1a1a2e] text-5xl">
            <span className="opacity-90">📦</span>
          </div>
        )}
        <div className="absolute left-2 top-2 flex gap-1">
          {p.listing_type !== "sale" && (
            <span className="rounded-md border border-primary bg-accent px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
              Rent
            </span>
          )}
          {p.listing_type !== "rent" && (
            <span className="rounded-md bg-foreground px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-background">
              Buy
            </span>
          )}
        </div>
        {p.delivery_available && (
          <span className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-background/90 text-secondary shadow-soft">
            <Truck className="h-3.5 w-3.5" />
          </span>
        )}
      </div>
      <div className="space-y-1 p-2.5">
        <h3 className="line-clamp-1 text-xs font-semibold leading-tight">{p.title}</h3>
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <MapPin className="h-2.5 w-2.5" />
          <span className="truncate">{[p.area, p.city].filter(Boolean).join(", ") || "Nearby"}</span>
        </div>
        {(p.rating ?? 0) > 0 && (
          <div className="flex items-center gap-0.5 text-[11px] font-semibold">
            <Star className="h-3 w-3 fill-warning text-warning" />
            {Number(p.rating).toFixed(1)}
          </div>
        )}
        <div className="pt-1">
          {p.rent_price_day != null && (
            <p className="text-sm font-extrabold leading-none text-primary">
              {formatINR(p.rent_price_day)}
              <span className="text-[10px] font-normal text-muted-foreground">/day</span>
            </p>
          )}
          {p.sale_price != null && p.listing_type !== "rent" && (
            <p className="mt-0.5 text-[10px] text-muted-foreground">Buy {formatINR(p.sale_price)}</p>
          )}
        </div>
        <button
          type="button"
          className="mt-2 w-full rounded-lg border border-primary bg-accent py-1.5 text-[11px] font-bold text-primary transition hover:bg-primary hover:text-primary-foreground"
        >
          {p.listing_type === "sale" ? "Buy Now" : "Rent Now"}
        </button>
      </div>
    </Link>
  );
}