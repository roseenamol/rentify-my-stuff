import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Trash2, ShoppingBag } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { formatINR } from "@/lib/format";
import { useCart } from "@/hooks/use-cart";

export const Route = createFileRoute("/cart")({
  head: () => ({ meta: [{ title: "Your cart — Rentify" }] }),
  component: CartPage,
});

function CartPage() {
  const { items, remove, subtotal, depositTotal } = useCart();
  const navigate = useNavigate();

  return (
    <AppLayout>
      <div className="mx-auto max-w-5xl px-4 py-8 lg:px-6">
        <h1 className="text-3xl font-black">Your cart</h1>
        {items.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-border bg-muted/30 px-6 py-16 text-center">
            <ShoppingBag className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-3 font-semibold">Your cart is empty</p>
            <Link to="/search"><Button className="mt-4 rounded-full">Browse rentals</Button></Link>
          </div>
        ) : (
          <div className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
            <div className="space-y-3">
              {items.map((i) => (
                <div key={i.productId + i.mode} className="flex gap-3 rounded-2xl border border-border bg-card p-3">
                  <div className="h-20 w-20 flex-none overflow-hidden rounded-lg bg-muted">
                    {i.image && <img src={i.image} alt="" className="h-full w-full object-cover" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">{i.title}</p>
                    <p className="text-xs text-muted-foreground capitalize">{i.mode}{i.mode === "rent" && i.days ? ` · ${i.days} day${i.days>1?"s":""}` : ""}</p>
                    <p className="mt-1 font-bold">
                      {i.mode === "rent"
                        ? formatINR((i.pricePerDay ?? 0) * (i.days ?? 1) * i.qty)
                        : formatINR((i.salePrice ?? 0) * i.qty)}
                    </p>
                  </div>
                  <button onClick={() => remove(i.productId, i.mode)} className="self-start rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="h-fit rounded-2xl border border-border bg-card p-5 shadow-soft">
              <h2 className="text-lg font-bold">Order summary</h2>
              <div className="mt-4 space-y-2 text-sm">
                <Row label="Subtotal" value={formatINR(subtotal)} />
                <Row label="Refundable deposit" value={formatINR(depositTotal)} muted />
                <Row label="Delivery" value="Calculated at checkout" muted />
                <div className="border-t border-border pt-2">
                  <Row label="Pay now" value={formatINR(subtotal + depositTotal)} bold />
                </div>
              </div>
              <Button onClick={() => navigate({ to: "/checkout" })} size="lg" className="mt-4 w-full rounded-full">
                Proceed to checkout
              </Button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

function Row({ label, value, muted, bold }: { label: string; value: string; muted?: boolean; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${muted ? "text-muted-foreground" : ""} ${bold ? "text-base font-bold" : ""}`}>
      <span>{label}</span><span>{value}</span>
    </div>
  );
}