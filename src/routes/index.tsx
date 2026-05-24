import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Sparkles, ShieldCheck, Truck, Zap } from "lucide-react";
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
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero" />
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-secondary/30 blur-3xl animate-float" />
        <div className="absolute -bottom-10 -left-10 h-72 w-72 rounded-full bg-accent/20 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:py-20 lg:px-6">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-3 py-1 text-xs font-semibold text-primary-foreground/90 backdrop-blur">
              <Sparkles className="h-3 w-3" /> New on Rentify · {location?.city ?? "Anywhere in India"}
            </span>
            <h1 className="mt-4 text-4xl font-black leading-[1.05] tracking-tight text-primary-foreground sm:text-5xl lg:text-6xl">
              Rent anything.<br />
              <span className="text-gradient bg-gradient-to-r from-accent to-[oklch(0.92_0.05_180)] bg-clip-text text-transparent">
                From your neighbors.
              </span>
            </h1>
            <p className="mt-4 max-w-lg text-base text-primary-foreground/80 sm:text-lg">
              Cameras, consoles, drills, wedding outfits — borrow what you need, list what you don't.
              Earn from your idle stuff.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/search">
                <Button size="lg" variant="secondary" className="rounded-full font-semibold">
                  Browse rentals <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/list-item">
                <Button size="lg" variant="outline" className="rounded-full border-primary-foreground/30 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20 hover:text-primary-foreground">
                  List your item
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-4 py-10 lg:px-6">
        <div className="mb-5 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Shop by category</h2>
            <p className="text-sm text-muted-foreground">Find exactly what you need to borrow today.</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-9">
          {categories.map((c) => (
            <CategoryTile key={c.id} slug={c.slug} name={c.name} icon={c.icon} />
          ))}
        </div>
      </section>

      {/* Featured */}
      <section className="mx-auto max-w-7xl px-4 py-6 lg:px-6">
        <div className="mb-5 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              {location?.city ? `Trending in ${location.city}` : "Recently listed"}
            </h2>
            <p className="text-sm text-muted-foreground">Fresh listings from real owners near you.</p>
          </div>
          <Link to="/search" className="text-sm font-semibold text-secondary hover:underline">
            View all
          </Link>
        </div>
        {featured.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4 xl:grid-cols-6">
            {featured.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
        )}
      </section>

      {/* Value props */}
      <section className="mx-auto max-w-7xl px-4 py-12 lg:px-6">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { icon: ShieldCheck, title: "Deposit protected", desc: "Every rental is secured with a refundable deposit." },
            { icon: Truck, title: "Doorstep delivery", desc: "Choose pickup or get items delivered to your door." },
            { icon: Zap, title: "Earn from idle stuff", desc: "Turn that unused drill or DSLR into monthly income." },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-2xl border border-border bg-card p-5 shadow-soft">
              <span className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-gradient-accent text-primary-foreground">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="font-bold">{title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </section>
    </AppLayout>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-muted/30 px-6 py-12 text-center">
      <p className="text-base font-semibold">No listings here yet</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Be the first — list an item and start earning.
      </p>
      <Link to="/list-item">
        <Button className="mt-4 rounded-full">List your first item</Button>
      </Link>
    </div>
  );
}