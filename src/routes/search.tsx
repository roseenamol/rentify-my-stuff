import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";
import { Filter, Loader2, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { ProductCard, type ProductCardData } from "@/components/products/ProductCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useLocation } from "@/hooks/use-location";

const SearchSchema = z.object({
  q: z.string().optional(),
  type: z.enum(["all", "rent", "sale"]).optional(),
  delivery: z.coerce.boolean().optional(),
  sort: z.enum(["recent", "price_asc", "price_desc", "rating"]).optional(),
});

export const Route = createFileRoute("/search")({
  validateSearch: (s) => SearchSchema.parse(s),
  head: () => ({ meta: [{ title: "Search rentals — Rentify" }] }),
  component: SearchPage,
});

function SearchPage() {
  const params = Route.useSearch();
  const navigate = Route.useNavigate();
  const { location } = useLocation();
  const [q, setQ] = useState(params.q ?? "");

  const type = params.type ?? "all";
  const sort = params.sort ?? "recent";
  const delivery = params.delivery ?? false;

  const { data, isFetching } = useQuery({
    queryKey: ["search", params, location?.city],
    queryFn: async () => {
      let query = supabase
        .from("products")
        .select("id,title,images,rent_price_day,sale_price,deposit,city,area,delivery_available,rating,listing_type")
        .eq("status", "active");
      if (params.q) query = query.ilike("title", `%${params.q}%`);
      if (location?.city) query = query.eq("city", location.city);
      if (type === "rent") query = query.in("listing_type", ["rent", "both"]);
      if (type === "sale") query = query.in("listing_type", ["sale", "both"]);
      if (delivery) query = query.eq("delivery_available", true);
      if (sort === "recent") query = query.order("created_at", { ascending: false });
      if (sort === "price_asc") query = query.order("rent_price_day", { ascending: true, nullsFirst: false });
      if (sort === "price_desc") query = query.order("rent_price_day", { ascending: false, nullsFirst: false });
      if (sort === "rating") query = query.order("rating", { ascending: false });
      const { data, error } = await query.limit(60);
      if (error) throw error;
      return data as ProductCardData[];
    },
  });

  const setSearch = (patch: Partial<typeof params>) =>
    navigate({ to: "/search", search: { ...params, ...patch } as never, replace: true });

  return (
    <AppLayout>
      <div className="mx-auto max-w-7xl px-4 py-5 lg:px-6">
        <div className="mb-1">
          <h1 className="text-lg font-bold">Browse Rentals</h1>
          <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <MapPin className="h-3 w-3" />
            {location?.city ?? "Set your location"} · {data?.length ?? 0} items
          </p>
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); setSearch({ q }); }}
          className="mt-3 flex gap-2"
        >
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search cameras, bikes, tools…"
            className="h-11 rounded-xl border-2 bg-muted/60 focus-visible:border-primary"
          />
          <Button type="submit" className="h-11 rounded-xl bg-primary px-5 font-bold">Search</Button>
        </form>

        {/* Category-style type chips */}
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {([["all","✦ All"],["rent","Rent only"],["sale","Buy only"]] as const).map(([k,l]) => (
            <button
              key={k}
              onClick={() => setSearch({ type: k })}
              className={`whitespace-nowrap rounded-full border-[1.5px] px-4 py-1.5 text-xs font-semibold transition ${
                type === k ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:border-primary"
              }`}
            >
              {l}
            </button>
          ))}
          <button
            onClick={() => setSearch({ delivery: !delivery })}
            className={`whitespace-nowrap rounded-full border-[1.5px] px-4 py-1.5 text-xs font-semibold transition ${
              delivery ? "border-primary bg-accent text-primary" : "border-border bg-card text-muted-foreground hover:border-primary"
            }`}
          >
            🚚 Delivery
          </button>
        </div>

        {/* Sort row */}
        <div className="mt-3 flex items-center justify-between">
          <div className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold">
            <Filter className="h-3 w-3" />
            <select
              value={sort}
              onChange={(e) => setSearch({ sort: e.target.value as never })}
              className="bg-transparent text-xs font-semibold outline-none"
            >
              <option value="recent">Recently added</option>
              <option value="price_asc">Price: Low → High</option>
              <option value="price_desc">Price: High → Low</option>
              <option value="rating">Top Rated</option>
            </select>
          </div>
        </div>

        {isFetching ? (
          <div className="grid place-items-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : !data || data.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-border bg-muted/40 px-6 py-16 text-center">
            <div className="text-5xl">🔍</div>
            <p className="mt-3 font-semibold">No results found</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Try adjusting your filters or search term
            </p>
          </div>
        ) : (
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4 xl:grid-cols-5">
            {data.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
        )}
      </div>
    </AppLayout>
  );
}