import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";
import { Filter, Loader2 } from "lucide-react";
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
      <div className="mx-auto max-w-7xl px-4 py-6 lg:px-6">
        <form
          onSubmit={(e) => { e.preventDefault(); setSearch({ q }); }}
          className="flex gap-2"
        >
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search rentals…"
            className="h-11 rounded-full"
          />
          <Button type="submit" className="h-11 rounded-full px-6">Search</Button>
        </form>

        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
          <Filter className="h-4 w-4 text-muted-foreground" />
          {([["all","All"],["rent","Rent only"],["sale","Buy only"]] as const).map(([k,l]) => (
            <button
              key={k}
              onClick={() => setSearch({ type: k })}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                type === k ? "border-secondary bg-secondary text-secondary-foreground" : "border-border hover:bg-muted"
              }`}
            >
              {l}
            </button>
          ))}
          <button
            onClick={() => setSearch({ delivery: !delivery })}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
              delivery ? "border-secondary bg-secondary text-secondary-foreground" : "border-border hover:bg-muted"
            }`}
          >
            Delivery available
          </button>
          <select
            value={sort}
            onChange={(e) => setSearch({ sort: e.target.value as never })}
            className="ml-auto h-8 rounded-full border border-border bg-background px-3 text-xs font-semibold"
          >
            <option value="recent">Recently added</option>
            <option value="price_asc">Price: low → high</option>
            <option value="price_desc">Price: high → low</option>
            <option value="rating">Top rated</option>
          </select>
        </div>

        <h1 className="mt-6 text-xl font-bold">
          {params.q ? `Results for "${params.q}"` : "All rentals"}
          {location?.city && <span className="ml-2 text-sm font-medium text-muted-foreground">in {location.city}</span>}
        </h1>

        {isFetching ? (
          <div className="grid place-items-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : !data || data.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-border bg-muted/30 px-6 py-12 text-center">
            <p className="font-semibold">No matches found</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {location?.city ? `Try a wider area or change your location.` : `Try setting your location to see items near you.`}
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