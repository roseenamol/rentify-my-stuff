import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { ProductCard, type ProductCardData } from "@/components/products/ProductCard";
import { useLocation } from "@/hooks/use-location";

export const Route = createFileRoute("/category/$slug")({
  head: ({ params }) => ({ meta: [{ title: `${params.slug.replace(/-/g," ")} — Rentify` }] }),
  component: CategoryPage,
});

function CategoryPage() {
  const { slug } = Route.useParams();
  const { location } = useLocation();

  const { data: category } = useQuery({
    queryKey: ["category", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, slug, subcategories(id, name, slug)")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: products = [] } = useQuery({
    queryKey: ["category-products", category?.id, location?.city],
    enabled: !!category?.id,
    queryFn: async () => {
      let q = supabase
        .from("products")
        .select("id,title,images,rent_price_day,sale_price,deposit,city,area,delivery_available,rating,listing_type")
        .eq("status", "active")
        .eq("category_id", category!.id)
        .order("created_at", { ascending: false });
      if (location?.city) q = q.eq("city", location.city);
      const { data, error } = await q.limit(60);
      if (error) throw error;
      return data as ProductCardData[];
    },
  });

  return (
    <AppLayout>
      <section className="bg-gradient-hero px-4 py-10 text-primary-foreground lg:px-6">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary-foreground/70">Category</p>
          <h1 className="mt-1 text-3xl font-black sm:text-4xl">{category?.name ?? slug.replace(/-/g," ")}</h1>
          {location?.city && <p className="mt-1 text-sm text-primary-foreground/80">Showing items in {location.city}</p>}
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-6 lg:px-6">
        {category?.subcategories && category.subcategories.length > 0 && (
          <div className="mb-5 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {category.subcategories.map((s: { id: string; name: string; slug: string }) => (
              <span key={s.id} className="whitespace-nowrap rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold">
                {s.name}
              </span>
            ))}
          </div>
        )}
        {products.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/30 px-6 py-12 text-center">
            <p className="font-semibold">No items in this category yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Be the first to list one.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4 xl:grid-cols-5">
            {products.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
        )}
      </div>
    </AppLayout>
  );
}