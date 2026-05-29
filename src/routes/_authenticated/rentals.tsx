import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarRange, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { formatINR } from "@/lib/format";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/rentals")({
  head: () => ({ meta: [{ title: "My rentals — Rentify" }] }),
  component: RentalsPage,
});

function RentalsPage() {
  const { user } = useAuth();

  const { data: rentals = [] } = useQuery({
    queryKey: ["my-rentals", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rentals")
        .select("id, status, total_amount, deposit, start_date, end_date, products(id, title, images)")
        .eq("renter_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: orders = [] } = useQuery({
    queryKey: ["my-orders", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, status, amount, products(id, title, images)")
        .eq("buyer_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <AppLayout>
      <section className="bg-gradient-hero px-4 py-10 text-primary-foreground lg:px-6">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-3xl font-black sm:text-4xl">My rentals & orders</h1>
          <p className="mt-1 text-sm text-primary-foreground/80">Track active rentals, returns, and purchases.</p>
        </div>
      </section>

      <div className="mx-auto max-w-5xl space-y-8 px-4 py-8 lg:px-6">
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-xl font-bold"><CalendarRange className="h-5 w-5" /> Active rentals</h2>
          {rentals.length === 0 ? (
            <Empty msg="No rentals yet." />
          ) : (
            <div className="space-y-3">
              {rentals.map((r: { id: string; products: { id: string; title: string; images: string[] } | null; start_date: string; end_date: string; total_amount: number; deposit: number; status: string }) => (
                <RentalCard key={r.id}
                  title={r.products?.title ?? "Item"}
                  image={r.products?.images?.[0]}
                  productId={r.products?.id}
                  status={r.status}
                  meta={`${r.start_date} → ${r.end_date}`}
                  amount={`${formatINR(r.total_amount)} + ${formatINR(r.deposit)} deposit`}
                />
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-3 flex items-center gap-2 text-xl font-bold"><Package className="h-5 w-5" /> Purchases</h2>
          {orders.length === 0 ? (
            <Empty msg="No purchases yet." />
          ) : (
            <div className="space-y-3">
              {orders.map((o: { id: string; products: { id: string; title: string; images: string[] } | null; amount: number; status: string }) => (
                <RentalCard key={o.id}
                  title={o.products?.title ?? "Item"}
                  image={o.products?.images?.[0]}
                  productId={o.products?.id}
                  status={o.status}
                  meta="Purchase"
                  amount={formatINR(o.amount)}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </AppLayout>
  );
}

function RentalCard({ title, image, productId, status, meta, amount }: {
  title: string; image?: string; productId?: string; status: string; meta: string; amount: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
      <div className="h-16 w-16 flex-none overflow-hidden rounded-lg bg-muted">
        {image && <img src={image} alt="" className="h-full w-full object-cover" />}
      </div>
      <div className="flex-1">
        {productId
          ? <Link to="/product/$id" params={{ id: productId }} className="font-semibold hover:underline">{title}</Link>
          : <p className="font-semibold">{title}</p>}
        <p className="text-xs text-muted-foreground">{meta}</p>
        <p className="text-sm font-bold">{amount}</p>
      </div>
      <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-bold capitalize">{status.replace(/_/g," ")}</span>
    </div>
  );
}

function Empty({ msg }: { msg: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-muted/30 px-6 py-10 text-center">
      <p className="text-sm text-muted-foreground">{msg}</p>
      <Link to="/search"><Button variant="outline" className="mt-3 rounded-full">Browse rentals</Button></Link>
    </div>
  );
}