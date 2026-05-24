import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Package, IndianRupee, Star, Trash2, EyeOff, Eye, Tag } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { formatINR } from "@/lib/format";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Owner dashboard — Rentify" }] }),
  component: DashboardPage,
});

function DashboardPage() {
  const { user, loading } = useAuth();
  const qc = useQueryClient();

  if (!loading && !user) throw redirect({ to: "/login" });

  const { data: products = [] } = useQuery({
    queryKey: ["my-products", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("owner_id", user!.id)
        .neq("status", "deleted")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: rentals = [] } = useQuery({
    queryKey: ["my-owner-rentals", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rentals")
        .select("id, status, total_amount, start_date, end_date, products(title)")
        .eq("owner_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "active" | "unavailable" | "sold" | "deleted" }) => {
      const { error } = await supabase.from("products").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["my-products"] }); toast.success("Updated"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const earnings = rentals.reduce((s: number, r: { total_amount: number }) => s + Number(r.total_amount || 0), 0);

  return (
    <AppLayout>
      <section className="bg-gradient-hero px-4 py-10 text-primary-foreground lg:px-6">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-3xl font-black sm:text-4xl">Owner dashboard</h1>
          <p className="mt-1 text-sm text-primary-foreground/80">Track your listings, requests & earnings.</p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 lg:px-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <Stat icon={Package} label="Active listings" value={String(products.filter((p: { status: string }) => p.status === "active").length)} />
          <Stat icon={IndianRupee} label="Lifetime earnings" value={formatINR(earnings)} />
          <Stat icon={Star} label="Total bookings" value={String(rentals.length)} />
        </div>

        <div>
          <div className="mb-4 flex items-end justify-between">
            <h2 className="text-xl font-bold">My listings</h2>
            <Link to="/list-item"><Button className="rounded-full">+ Add new</Button></Link>
          </div>
          {products.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-muted/30 px-6 py-12 text-center">
              <p className="font-semibold">No listings yet</p>
              <Link to="/list-item"><Button className="mt-3 rounded-full">List your first item</Button></Link>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((p: { id: string; title: string; images: string[]; status: string; rent_price_day: number; sale_price: number; listing_type: string }) => (
                <div key={p.id} className="overflow-hidden rounded-2xl border border-border bg-card">
                  <div className="flex gap-3 p-3">
                    <div className="h-20 w-20 flex-none overflow-hidden rounded-lg bg-muted">
                      {p.images?.[0] && <img src={p.images[0]} alt="" className="h-full w-full object-cover" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <Link to="/product/$id" params={{ id: p.id }} className="line-clamp-1 font-semibold hover:underline">{p.title}</Link>
                      <p className="text-xs text-muted-foreground">{p.rent_price_day ? `${formatINR(p.rent_price_day)}/day` : ""}{p.sale_price ? ` · Buy ${formatINR(p.sale_price)}` : ""}</p>
                      <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                        p.status === "active" ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"
                      }`}>{p.status}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 border-t border-border text-xs">
                    <ActionBtn icon={Tag} label="Sell" onClick={() => updateStatus.mutate({ id: p.id, status: "sold" })} />
                    {p.status === "active"
                      ? <ActionBtn icon={EyeOff} label="Hide" onClick={() => updateStatus.mutate({ id: p.id, status: "unavailable" })} />
                      : <ActionBtn icon={Eye} label="Activate" onClick={() => updateStatus.mutate({ id: p.id, status: "active" })} />
                    }
                    <ActionBtn icon={Trash2} label="Delete" onClick={() => updateStatus.mutate({ id: p.id, status: "deleted" })} />
                    <Link to="/product/$id" params={{ id: p.id }} className="grid place-items-center border-l border-border py-2 font-semibold text-secondary hover:bg-muted">View</Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="mb-4 text-xl font-bold">Recent rental requests</h2>
          {rentals.length === 0 ? (
            <p className="text-sm text-muted-foreground">No rental requests yet.</p>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-border bg-card">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 text-left">Item</th>
                    <th className="px-4 py-3 text-left">Dates</th>
                    <th className="px-4 py-3 text-left">Amount</th>
                    <th className="px-4 py-3 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rentals.map((r: { id: string; products: { title: string } | null; start_date: string; end_date: string; total_amount: number; status: string }) => (
                    <tr key={r.id} className="border-t border-border">
                      <td className="px-4 py-3 font-semibold">{r.products?.title ?? "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{r.start_date} → {r.end_date}</td>
                      <td className="px-4 py-3 font-semibold">{formatINR(r.total_amount)}</td>
                      <td className="px-4 py-3"><span className="rounded-full bg-muted px-2 py-0.5 text-xs capitalize">{r.status.replace(/_/g," ")}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof Package; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <span className="mb-2 grid h-10 w-10 place-items-center rounded-xl bg-gradient-accent text-primary-foreground"><Icon className="h-5 w-5" /></span>
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-black">{value}</p>
    </div>
  );
}
function ActionBtn({ icon: Icon, label, onClick }: { icon: typeof Trash2; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-0.5 border-l border-border py-2 font-semibold text-muted-foreground transition first:border-l-0 hover:bg-muted hover:text-foreground">
      <Icon className="h-3.5 w-3.5" />{label}
    </button>
  );
}