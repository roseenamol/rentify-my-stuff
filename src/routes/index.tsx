import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, ShieldCheck, Truck, Zap, CheckCircle2, Lock, Package, Users, Building2, Lightbulb } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { CategoryTile } from "@/components/products/CategoryTile";
import { ProductCard, type ProductCardData } from "@/components/products/ProductCard";
import { Button } from "@/components/ui/button";
import { useLocation } from "@/hooks/use-location";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Rentify — Rent or sell anything in your city" },
      { name: "description", content: "India's modern rental marketplace. Discover nearby rentals — cameras, gaming consoles, tools, party gear and more." },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const { location } = useLocation();

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, slug, icon")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { data: featured = [] } = useQuery({
    queryKey: ["featured", location?.city],
    queryFn: async () => {
      let q = supabase
        .from("products")
        .select("id,title,images,rent_price_day,sale_price,deposit,city,area,delivery_available,rating,listing_type")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(12);
      if (location?.city) q = q.eq("city", location.city);
      const { data, error } = await q;
      if (error) throw error;
      return data as ProductCardData[];
    },
  });

  return (
    <AppLayout>
      {/* Hero Banner */}
      <section className="px-4 pt-4 lg:px-6">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-2xl p-5 sm:p-8" style={{ background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)" }}>
          <div className="absolute -right-5 -top-5 h-32 w-32 rounded-full bg-primary/15 blur-md" />
          <div className="absolute bottom-0 right-10 h-20 w-20 rounded-full bg-blue-400/10 blur-md" />
          <div className="relative max-w-xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-primary">🔥 Limited time offer</p>
            <h1 className="mt-2 font-display text-3xl font-extrabold leading-tight text-white sm:text-5xl">
              Rent Anything.<br />Anywhere in {location?.city?.split(",")[0] ?? "India"}.
            </h1>
            <p className="mt-3 text-sm text-white/70 sm:text-base">
              Save up to 90% vs buying. 500+ items near you.
            </p>
            <Link to="/search">
              <Button className="mt-5 rounded-xl bg-primary px-5 font-bold text-primary-foreground hover:bg-primary/90">
                Explore Now <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="pointer-events-none absolute -bottom-3 right-4 text-7xl opacity-80 sm:text-8xl">📦</div>
        </div>
      </section>

      {/* Stats */}
      <section className="mx-auto max-w-7xl px-4 pt-4 lg:px-6">
        <div className="grid grid-cols-3 gap-2.5">
          {[
            { label: "Items Listed", value: "2,400+", Icon: Package },
            { label: "Active Users", value: "1,800+", Icon: Users },
            { label: "Cities", value: "14", Icon: Building2 },
          ].map(({ label, value, Icon }) => (
            <div key={label} className="rounded-xl border border-border bg-card px-3 py-3 text-center">
              <Icon className="mx-auto h-5 w-5 text-primary" />
              <p className="mt-1 text-base font-extrabold">{value}</p>
              <p className="text-[10px] text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-4 pt-6 lg:px-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-bold">Browse Categories</h2>
          <Link to="/search" className="text-xs font-semibold text-primary">See all →</Link>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((c) => (
            <CategoryTile key={c.id} slug={c.slug} name={c.name} icon={c.icon} />
          ))}
        </div>
      </section>

      {/* Featured */}
      <section className="mx-auto max-w-7xl px-4 pt-6 lg:px-6">
        <div className="mb-3 flex items-end justify-between">
          <div>
            <h2 className="text-base font-bold">Featured Rentals</h2>
            <p className="text-xs text-muted-foreground">
              Handpicked for you{location?.city ? ` in ${location.city.split(",")[0]}` : ""}
            </p>
          </div>
          <Link to="/search" className="text-xs font-semibold text-primary">View all →</Link>
        </div>
        {featured.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4 xl:grid-cols-6">
            {featured.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
        )}
      </section>

      {/* List your item banner */}
      <section className="mx-auto max-w-7xl px-4 pt-6 lg:px-6">
        <div className="flex items-center gap-3 rounded-2xl border-[1.5px] border-dashed border-secondary bg-secondary/10 px-4 py-4">
          <Lightbulb className="h-9 w-9 flex-none text-secondary" />
          <div className="flex-1">
            <p className="text-sm font-bold">Have unused items?</p>
            <p className="text-xs text-muted-foreground">List them and earn while they sit idle.</p>
          </div>
          <Link to="/list-item">
            <Button className="rounded-xl bg-secondary font-bold text-secondary-foreground hover:bg-secondary/90">
              + List Now
            </Button>
          </Link>
        </div>
      </section>

      {/* Trust badges */}
      <section className="mx-auto max-w-7xl px-4 py-6 lg:px-6">
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="mb-3 text-center text-sm font-bold">Why Rentify?</p>
          <div className="grid grid-cols-2 gap-4">
            {[
              { Icon: Lock, title: "Secure Payments", sub: "UPI, Cards & Wallets" },
              { Icon: CheckCircle2, title: "Verified Listings", sub: "ID-checked owners" },
              { Icon: ShieldCheck, title: "Damage Cover", sub: "Up to ₹10,000" },
              { Icon: Truck, title: "Quick Delivery", sub: "Same-day pickups" },
            ].map(({ Icon, title, sub }) => (
              <div key={title} className="flex items-start gap-2.5">
                <Icon className="mt-0.5 h-5 w-5 flex-none text-primary" />
                <div>
                  <p className="text-xs font-bold">{title}</p>
                  <p className="text-[11px] text-muted-foreground">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </AppLayout>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-muted/40 px-6 py-12 text-center">
      <p className="text-base font-semibold">No listings here yet</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Be the first — list an item and start earning.
      </p>
      <Link to="/list-item">
        <Button className="mt-4 rounded-xl">List your first item</Button>
      </Link>
    </div>
  );
}