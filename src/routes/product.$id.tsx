import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Star, MapPin, Truck, ShieldCheck, Calendar, ArrowLeft, Loader2 } from "lucide-react";
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

  const { data: p, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(`*, owner:profiles!products_owner_id_fkey(display_name, avatar_url, city, is_verified, rating), category:categories(name, slug)`)
        .eq("id", id)
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
  const rentTotal = (p.rent_price_day ?? 0) * days;

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
      <div className="mx-auto max-w-7xl px-4 py-6 lg:px-6">
        <button onClick={() => navigate({ to: "/search" })} className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
          {/* Gallery */}
          <div>
            <div className="relative aspect-square overflow-hidden rounded-3xl border border-border bg-muted">
              {images[activeImg] ? (
                <img src={images[activeImg]} alt={p.title} className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full w-full place-items-center text-6xl font-black text-muted-foreground/30">
                  {p.title.slice(0, 1)}
                </div>
              )}
            </div>
            {images.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto scrollbar-hide">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    className={`h-20 w-20 flex-none overflow-hidden rounded-xl border-2 ${activeImg === i ? "border-secondary" : "border-transparent"}`}
                  >
                    <img src={img} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-5">
            <div>
              {p.category && (
                <Link to="/category/$slug" params={{ slug: p.category.slug }} className="text-xs font-semibold uppercase tracking-wider text-secondary">
                  {p.category.name}
                </Link>
              )}
              <h1 className="mt-1 text-3xl font-black leading-tight">{p.title}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" />{[p.area, p.city].filter(Boolean).join(", ") || "Nearby"}</span>
                {(p.rating ?? 0) > 0 && (
                  <span className="inline-flex items-center gap-1 font-semibold text-foreground">
                    <Star className="h-4 w-4 fill-warning text-warning" /> {Number(p.rating).toFixed(1)}
                  </span>
                )}
                {p.delivery_available && (
                  <span className="inline-flex items-center gap-1 text-secondary"><Truck className="h-4 w-4" /> Delivery available</span>
                )}
              </div>
            </div>

            {/* Pricing card */}
            <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
              {canRent && (
                <div className="mb-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Rent</p>
                  <p className="mt-1 text-3xl font-black">
                    {formatINR(p.rent_price_day)}<span className="text-base font-medium text-muted-foreground">/day</span>
                  </p>
                  {p.rent_price_week && (
                    <p className="text-xs text-muted-foreground">or {formatINR(p.rent_price_week)}/week</p>
                  )}

                  <div className="mt-4 flex items-end gap-3">
                    <div className="flex-1">
                      <label className="text-xs font-semibold text-muted-foreground">Days</label>
                      <Input type="number" min={1} max={90} value={days} onChange={(e) => setDays(Math.max(1, Number(e.target.value) || 1))} />
                    </div>
                    <div className="flex-1 rounded-xl bg-muted/50 px-3 py-2 text-right">
                      <p className="text-[10px] uppercase text-muted-foreground">Subtotal</p>
                      <p className="text-lg font-bold">{formatINR(rentTotal)}</p>
                    </div>
                  </div>
                  {(p.deposit ?? 0) > 0 && (
                    <p className="mt-2 text-xs text-muted-foreground">Refundable deposit: {formatINR(p.deposit)}</p>
                  )}
                  <Button onClick={handleRent} className="mt-4 w-full rounded-full" size="lg">
                    <Calendar className="mr-2 h-4 w-4" /> Rent now
                  </Button>
                </div>
              )}
              {canBuy && (
                <div className={canRent ? "border-t border-border pt-4" : ""}>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Buy</p>
                  <p className="mt-1 text-2xl font-black">{formatINR(p.sale_price)}</p>
                  <Button onClick={handleBuy} variant="outline" className="mt-3 w-full rounded-full" size="lg">
                    Buy now
                  </Button>
                </div>
              )}
            </div>

            {/* Owner */}
            <div className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-full bg-gradient-accent text-lg font-bold text-primary-foreground">
                  {(p.owner?.display_name ?? "U").slice(0,1).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold">{p.owner?.display_name ?? "Owner"}{p.owner?.is_verified && <ShieldCheck className="ml-1 inline h-4 w-4 text-secondary" />}</p>
                  <p className="text-xs text-muted-foreground">{p.owner?.city ?? "—"}</p>
                </div>
              </div>
            </div>

            {p.description && (
              <div>
                <h2 className="mb-2 text-lg font-bold">About this listing</h2>
                <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{p.description}</p>
              </div>
            )}
            {p.condition && (
              <p className="text-sm"><span className="font-semibold">Condition:</span> {p.condition}</p>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}