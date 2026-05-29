import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatINR } from "@/lib/format";
import { useCart } from "@/hooks/use-cart";
import { placeOrder } from "@/lib/checkout.functions";

export const Route = createFileRoute("/_authenticated/checkout")({
  head: () => ({ meta: [{ title: "Checkout — Rentify" }] }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const { items, subtotal, depositTotal, clear } = useCart();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [done, setDone] = useState(false);
  const [delivery, setDelivery] = useState<"pickup" | "delivery">("pickup");
  const [address, setAddress] = useState("");

  const placeOrderFn = useServerFn(placeOrder);

  const mut = useMutation({
    mutationFn: () =>
      placeOrderFn({
        data: {
          delivery_option: delivery,
          delivery_address: delivery === "delivery" ? address : null,
          items: items.map((i) => ({
            product_id: i.productId,
            mode: i.mode,
            qty: i.qty,
            days: i.mode === "rent" ? i.days ?? 1 : undefined,
          })),
        },
      }),
    onSuccess: () => {
      clear();
      qc.invalidateQueries({ queryKey: ["my-rentals"] });
      qc.invalidateQueries({ queryKey: ["my-orders"] });
      setDone(true);
    },
    onError: (e: Error) => toast.error(e.message || "Could not place your order"),
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;
    if (delivery === "delivery" && address.trim().length < 5) {
      toast.error("Please enter a delivery address.");
      return;
    }
    mut.mutate();
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
        <p className="mt-1 text-sm text-muted-foreground">
          Prices are recomputed securely on the server before your order is placed.
        </p>
        <form onSubmit={submit} className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
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
                  <Input value={address} onChange={(e) => setAddress(e.target.value)} required placeholder="Flat, building, area, city, pincode" maxLength={500} />
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-border bg-card p-5">
              <h2 className="mb-3 text-lg font-bold">Payment</h2>
              <p className="text-sm text-muted-foreground">Demo checkout — no charges. Wire up a payment provider when you're ready.</p>
            </div>
          </div>

          <div className="h-fit rounded-2xl border border-border bg-card p-5 shadow-soft">
            <h2 className="text-lg font-bold">Summary <span className="ml-2 text-xs font-medium text-muted-foreground">(estimated)</span></h2>
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
            <Button type="submit" disabled={mut.isPending || items.length === 0} size="lg" className="mt-4 w-full rounded-full">
              {mut.isPending ? "Placing order…" : "Place order"}
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}