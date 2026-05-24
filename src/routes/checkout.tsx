import { createFileRoute, useNavigate, redirect, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatINR } from "@/lib/format";
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [{ title: "Checkout — Rentify" }] }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const { items, subtotal, depositTotal, clear } = useCart();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [delivery, setDelivery] = useState<"pickup" | "delivery">("pickup");
  const [address, setAddress] = useState("");

  if (!loading && !user) throw redirect({ to: "/login" });

  const placeOrder = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || items.length === 0) return;
    setSubmitting(true);
    try {
      for (const it of items) {
        const { data: product } = await supabase.from("products").select("owner_id").eq("id", it.productId).maybeSingle();
        if (!product) continue;
        if (it.mode === "rent") {
          const start = new Date();
          const end = new Date(); end.setDate(end.getDate() + (it.days ?? 1));
          await supabase.from("rentals").insert({
            product_id: it.productId, renter_id: user.id, owner_id: product.owner_id,
            start_date: start.toISOString().slice(0,10),
            end_date: end.toISOString().slice(0,10),
            total_amount: (it.pricePerDay ?? 0) * (it.days ?? 1) * it.qty,
            deposit: (it.deposit ?? 0) * it.qty,
            delivery_option: delivery,
            delivery_address: delivery === "delivery" ? address : null,
          });
        } else {
          await supabase.from("orders").insert({
            product_id: it.productId, buyer_id: user.id, owner_id: product.owner_id,
            amount: (it.salePrice ?? 0) * it.qty,
            delivery_option: delivery,
            delivery_address: delivery === "delivery" ? address : null,
          });
        }
      }
      clear();
      setDone(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <AppLayout>
        <div className="mx-auto max-w-md px-4 py-20 text-center">
          <CheckCircle2 className="mx-auto h-16 w-16 text-success" />
          <h1 className="mt-4 text-3xl font-black">Order placed!</h1>
          <p className="mt-2 text-sm text-muted-foreground">We've notified the owner. Track your bookings in My Rentals.</p>
          <div className="mt-6 flex justify-center gap-3">
            <Button onClick={() => navigate({ to: "/rentals" })} className="rounded-full">View my rentals</Button>
            <Link to="/"><Button variant="outline" className="rounded-full">Back home</Button></Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-4xl px-4 py-8 lg:px-6">
        <h1 className="text-3xl font-black">Checkout</h1>
        <form onSubmit={placeOrder} className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <div className="space-y-5">
            <div className="rounded-2xl border border-border bg-card p-5">
              <h2 className="mb-3 text-lg font-bold">Delivery</h2>
              <div className="flex gap-2">
                {(["pickup","delivery"] as const).map((d) => (
                  <button type="button" key={d} onClick={() => setDelivery(d)}
                    className={`flex-1 rounded-xl border px-3 py-3 text-sm font-semibold capitalize ${delivery === d ? "border-secondary bg-secondary/10 text-secondary" : "border-border"}`}>
                    {d === "pickup" ? "I'll pick up" : "Deliver to me"}
                  </button>
                ))}
              </div>
              {delivery === "delivery" && (
                <div className="mt-4">
                  <Label>Delivery address</Label>
                  <Input value={address} onChange={(e) => setAddress(e.target.value)} required placeholder="Flat, building, area, city, pincode" />
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-border bg-card p-5">
              <h2 className="mb-3 text-lg font-bold">Payment</h2>
              <p className="text-sm text-muted-foreground">Demo checkout — no charges. We'll wire up a real payment provider when you're ready.</p>
            </div>
          </div>

          <div className="h-fit rounded-2xl border border-border bg-card p-5 shadow-soft">
            <h2 className="text-lg font-bold">Summary</h2>
            <div className="mt-3 space-y-2 text-sm">
              {items.map((i) => (
                <div key={i.productId + i.mode} className="flex justify-between">
                  <span className="truncate pr-3">{i.title} <span className="text-muted-foreground capitalize">· {i.mode}</span></span>
                  <span className="font-semibold">{formatINR(i.mode === "rent" ? (i.pricePerDay ?? 0) * (i.days ?? 1) * i.qty : (i.salePrice ?? 0) * i.qty)}</span>
                </div>
              ))}
              <div className="border-t border-border pt-2 text-base font-bold">
                <div className="flex justify-between"><span>Total</span><span>{formatINR(subtotal + depositTotal)}</span></div>
              </div>
            </div>
            <Button type="submit" disabled={submitting || items.length === 0} size="lg" className="mt-4 w-full rounded-full">
              {submitting ? "Placing order…" : "Place order"}
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}