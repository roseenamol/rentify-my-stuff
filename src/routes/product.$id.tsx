import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Star, MapPin, Truck, ShieldCheck, Calendar, ArrowLeft, Loader2, Minus, Plus, Lock, Heart } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatINR } from "@/lib/format";
import { useCart } from "@/hooks/use-cart";

export const Route = createFileRoute("/product/$id")({
  head: () => ({ meta: [{ title: "Listing — Rentify" }] }),
  component: ProductPage,
});

function ProductPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { add } = useCart();
  const [days, setDays] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const [wish, setWish] = useState(false);

  const { data: p, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(`*, category:categories(name, slug)`)
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: owner } = useQuery({
    queryKey: ["owner", p?.owner_id],
    enabled: !!p?.owner_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("display_name, avatar_url, city, is_verified, rating")
        .eq("id", p!.owner_id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return <AppLayout><div className="grid place-items-center py-32"><Loader2 className="h-6 w-6 animate-spin" /></div></AppLayout>;
  }
  if (!p) {
    return <AppLayout><div className="px-4 py-12 text-center text-muted-foreground">Listing not found.</div></AppLayout>;
  }

  const images: string[] = p.images?.length ? p.images : [];
  const canRent = p.listing_type !== "sale";
  const canBuy = p.listing_type !== "rent";
  const pricePerDay = Number(p.rent_price_day ?? 0);
  const deposit = Number(p.deposit ?? 0);
  const rentTotal = pricePerDay * days;
  const serviceFee = Math.round(rentTotal * 0.05);

  const handleRent = () => {
    add({
      productId: p.id, title: p.title, image: images[0],
      mode: "rent", pricePerDay: Number(p.rent_price_day ?? 0),
      deposit: Number(p.deposit ?? 0), days, qty: 1,
    });
    toast.success("Added to cart");
  };
  const handleBuy = () => {
    add({
      productId: p.id, title: p.title, image: images[0],
      mode: "buy", salePrice: Number(p.sale_price ?? 0), qty: 1,
    });
    toast.success("Added to cart");
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-7xl px-4 py-5 lg:px-6">
        <div className="mb-4 flex items-center gap-2">
          <button onClick={() => navigate({ to: "/search" })} className="grid h-9 w-9 place-items-center rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex-1 truncate">
            <p className="truncate text-sm font-bold">{p.title}</p>
            {p.category && <p className="text-[11px] text-muted-foreground">{p.category.name}</p>}
          </div>
          <button
            onClick={() => setWish((w) => !w)}
            className={`grid h-9 w-9 place-items-center rounded-xl border ${wish ? "border-primary bg-accent text-primary" : "border-border bg-card text-muted-foreground"}`}
          >
            <Heart className={`h-4 w-4 ${wish ? "fill-primary" : ""}`} />
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          {/* Gallery */}
          <div>
            <div
              className="relative aspect-[4/3] overflow-hidden rounded-2xl"
              style={{ background: "#1a1a2e" }}
            >
              <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 30% 40%, rgba(232,64,87,0.15) 0%, transparent 60%)" }} />
              {images[activeImg] ? (
                <img src={images[activeImg]} alt={p.title} className="relative h-full w-full object-cover" />
              ) : (
                <div className="relative grid h-full w-full place-items-center text-7xl">
                  📦
                </div>
              )}
              {p.condition && (
                <span className="absolute right-3 top-3 rounded-full border border-secondary/40 bg-secondary/15 px-2.5 py-1 text-[11px] font-bold text-secondary">
                  ● {p.condition}
                </span>
              )}
            </div>
            {images.length > 1 && (
              <div className="mt-3 flex justify-center gap-2 overflow-x-auto scrollbar-hide">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    className={`h-12 w-12 flex-none overflow-hidden rounded-lg border-2 ${activeImg === i ? "border-primary" : "border-border"}`}
                  >
                    <img src={img} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-4">
            <div>
              {p.category && (
                <Link to="/category/$slug" params={{ slug: p.category.slug }} className="text-[11px] font-semibold uppercase tracking-wider text-primary">
                  {p.category.name}
                </Link>
              )}
              <h1 className="mt-1 font-display text-2xl font-extrabold leading-tight sm:text-3xl">{p.title}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                {(p.rating ?? 0) > 0 && (
                  <span className="inline-flex items-center gap-1 font-semibold text-foreground">
                    <Star className="h-3.5 w-3.5 fill-warning text-warning" /> {Number(p.rating).toFixed(1)}
                  </span>
                )}
                {p.delivery_available && (
                  <span className="inline-flex items-center gap-1 text-secondary"><Truck className="h-3.5 w-3.5" /> Delivery available</span>
                )}
              </div>
              {/* Location pill */}
              <div className="mt-3 flex items-center gap-2 rounded-xl bg-muted/60 px-3 py-2.5">
                <MapPin className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-xs font-semibold">{[p.area, p.city].filter(Boolean).join(", ") || "Nearby"}</p>
                  <p className="text-[11px] text-muted-foreground">Pickup or delivery</p>
                </div>
              </div>
            </div>

            {/* Pricing card */}
            <div className="rounded-2xl border-[1.5px] border-border bg-card p-5">
              {canRent && (
                <div className="mb-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-primary">{formatINR(pricePerDay)}</span>
                    <span className="text-sm text-muted-foreground">/day</span>
                  </div>
                  {p.rent_price_week && (
                    <p className="text-xs font-semibold text-secondary">
                      Weekly: {formatINR(p.rent_price_week)} ✓
                    </p>
                  )}

                  {/* Duration picker */}
                  <div className="mt-4">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-bold">Rental Duration</span>
                      <span className="text-sm font-extrabold text-primary">{days} day{days > 1 ? "s" : ""}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setDays((d) => Math.max(1, d - 1))}
                        className="grid h-9 w-9 place-items-center rounded-lg border-[1.5px] border-border bg-muted/60 font-bold"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <input
                        type="range"
                        min={1}
                        max={30}
                        value={days}
                        onChange={(e) => setDays(Number(e.target.value))}
                        className="flex-1 accent-[oklch(0.62_0.20_18)]"
                      />
                      <button
                        type="button"
                        onClick={() => setDays((d) => Math.min(30, d + 1))}
                        className="grid h-9 w-9 place-items-center rounded-lg border-[1.5px] border-primary bg-accent font-bold text-primary"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
                      <span>1 day</span><span>30 days</span>
                    </div>
                  </div>

                  {/* Cost breakdown */}
                  <div className="mt-4 space-y-2 rounded-xl bg-muted/60 px-3.5 py-3 text-xs">
                    <Row label={`${formatINR(pricePerDay)} × ${days} day${days > 1 ? "s" : ""}`} value={formatINR(rentTotal)} />
                    {deposit > 0 && <Row label="Refundable deposit" value={formatINR(deposit)} />}
                    <Row label="Service fee (5%)" value={formatINR(serviceFee)} />
                    <Row label="🛡️ Damage cover" value="Included" green />
                    <div className="my-1 h-px bg-border" />
                    <div className="flex justify-between text-sm font-extrabold">
                      <span>Total (excl. deposit)</span>
                      <span className="text-primary">{formatINR(rentTotal + serviceFee)}</span>
                    </div>
                  </div>

                  {/* Deposit policy */}
                  {deposit > 0 && (
                    <div className="mt-3 rounded-xl border border-secondary/30 bg-secondary/10 px-3 py-2.5">
                      <p className="flex items-center gap-1.5 text-xs font-bold text-secondary">
                        <Lock className="h-3.5 w-3.5" /> Deposit Policy
                      </p>
                      <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
                        {formatINR(deposit)} refundable within 24 hrs of safe return in original condition.
                      </p>
                    </div>
                  )}

                  <Button onClick={handleRent} className="mt-4 w-full rounded-xl bg-primary font-bold text-primary-foreground hover:bg-primary/90" size="lg">
                    <Calendar className="mr-2 h-4 w-4" /> Rent now
                  </Button>
                </div>
              )}
              {canBuy && (
                <div className={canRent ? "border-t border-border pt-4" : ""}>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Buy second-hand</p>
                  <p className="mt-1 text-2xl font-extrabold">{formatINR(p.sale_price)}</p>
                  <Button onClick={handleBuy} variant="outline" className="mt-3 w-full rounded-xl border-primary text-primary hover:bg-accent" size="lg">
                    Buy now
                  </Button>
                </div>
              )}
            </div>

            {/* Owner */}
            <div className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-full bg-gradient-accent text-lg font-bold text-primary-foreground">
                  {(owner?.display_name ?? "U").slice(0,1).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold">
                    {owner?.display_name ?? "Owner"}
                    {owner?.is_verified && <ShieldCheck className="ml-1 inline h-4 w-4 text-secondary" />}
                  </p>
                  <p className="text-[11px] text-muted-foreground">{owner?.city ?? "—"}</p>
                </div>
              </div>
            </div>

            {p.description && (
              <div>
                <h2 className="mb-2 text-base font-bold">About this listing</h2>
                <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{p.description}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function Row({ label, value, green }: { label: string; value: string; green?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-semibold ${green ? "text-secondary" : ""}`}>{value}</span>
    </div>
  );
}