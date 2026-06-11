import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import {
  ArrowLeft, Bell, Package, CheckCircle2, Bike, Home, Hourglass,
  Undo2, Wallet, MapPin, Phone, MessageCircle, Download, AlertTriangle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { formatINR } from "@/lib/format";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/rentals/$id")({
  head: () => ({ meta: [{ title: "Order tracking — Rentify" }] }),
  component: TrackingPage,
});

type Tab = "tracking" | "details" | "alerts";

const STATUS_MAP: Record<string, { label: string; tone: string }> = {
  pending:           { label: "Pending",          tone: "bg-warning/15 text-warning" },
  accepted:          { label: "Accepted",         tone: "bg-info/15 text-info" },
  rejected:          { label: "Rejected",         tone: "bg-destructive/15 text-destructive" },
  out_for_delivery:  { label: "Out for delivery", tone: "bg-secondary/15 text-secondary" },
  delivered:         { label: "Delivered",        tone: "bg-success/15 text-success" },
  in_use:            { label: "Rental active",    tone: "bg-primary/15 text-primary" },
  return_scheduled:  { label: "Return scheduled", tone: "bg-warning/15 text-warning" },
  returned:          { label: "Returned",         tone: "bg-success/15 text-success" },
  cancelled:         { label: "Cancelled",        tone: "bg-muted text-muted-foreground" },
  completed:         { label: "Completed",        tone: "bg-success/15 text-success" },
};

const STEPS = [
  { key: "pending",          label: "Booking confirmed",  sub: "Payment received",        icon: CheckCircle2 },
  { key: "accepted",         label: "Owner accepted",     sub: "Owner confirmed booking", icon: CheckCircle2 },
  { key: "out_for_delivery", label: "Out for delivery",   sub: "Rider on the way",        icon: Bike },
  { key: "delivered",        label: "Delivered",          sub: "Handed over to you",      icon: Home },
  { key: "in_use",           label: "Rental active",      sub: "Enjoy your rental",       icon: Hourglass },
  { key: "return_scheduled", label: "Return scheduled",   sub: "Pickup slot confirmed",   icon: Undo2 },
  { key: "returned",         label: "Deposit refunded",   sub: "Refunded within 24h",     icon: Wallet },
] as const;

const RETURN_SLOTS = ["Tomorrow · 8–10 AM", "Tomorrow · 10–12 PM", "Tomorrow · 12–2 PM", "Day after · 8–10 AM"];

function TrackingPage() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("tracking");
  const [returnSlot, setReturnSlot] = useState<string | null>(null);
  const [returnDone, setReturnDone] = useState(false);

  const { data: rental, isLoading } = useQuery({
    queryKey: ["rental-detail", id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rentals")
        .select("id, status, total_amount, deposit, start_date, end_date, delivery_option, delivery_address, created_at, owner_id, products(id, title, images, location_city)")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: owner } = useQuery({
    queryKey: ["rental-owner", rental?.owner_id],
    enabled: !!rental?.owner_id,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("full_name, city").eq("id", rental!.owner_id).single();
      return data;
    },
  });

  const { activeIdx, progress } = useMemo(() => {
    if (!rental) return { activeIdx: 0, progress: 0 };
    const idx = Math.max(0, STEPS.findIndex((s) => s.key === rental.status));
    const safeIdx = idx < 0 ? 0 : idx;
    return { activeIdx: safeIdx, progress: Math.round(((safeIdx + 1) / STEPS.length) * 100) };
  }, [rental]);

  if (isLoading || !rental) {
    return (
      <AppLayout>
        <div className="grid min-h-[60vh] place-items-center text-sm text-muted-foreground">Loading your order…</div>
      </AppLayout>
    );
  }

  const status = STATUS_MAP[rental.status] ?? STATUS_MAP.pending;
  const product = rental.products;

  return (
    <AppLayout>
      <div className="mx-auto max-w-md pb-8">
        {/* Sticky header */}
        <div className="sticky top-0 z-30 border-b border-border bg-card/95 px-4 py-3 backdrop-blur">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate({ to: "/rentals" })}
                className="grid h-9 w-9 place-items-center rounded-xl border border-border bg-muted/50 transition hover:bg-muted"
                aria-label="Back"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div>
                <div className="text-sm font-extrabold">Order tracking</div>
                <div className="text-[11px] text-muted-foreground">#{rental.id.slice(0, 8).toUpperCase()}</div>
              </div>
            </div>
            <button
              onClick={() => setTab("alerts")}
              className="grid h-9 w-9 place-items-center rounded-xl border border-border bg-muted/50 transition hover:bg-muted"
              aria-label="Alerts"
            >
              <Bell className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Status hero */}
        <section className="relative overflow-hidden bg-gradient-hero px-4 py-5 text-primary-foreground">
          <div className="flex items-center gap-3">
            <div className="grid h-14 w-14 flex-none place-items-center overflow-hidden rounded-2xl bg-white/10">
              {product?.images?.[0]
                ? <img src={product.images[0]} alt="" className="h-full w-full object-cover" />
                : <Package className="h-6 w-6" />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-extrabold">{product?.title ?? "Item"}</div>
              <div className="text-xs text-primary-foreground/70">
                {rental.start_date} → {rental.end_date}
              </div>
              <span className={cn("mt-1 inline-flex rounded-full px-2 py-0.5 text-[11px] font-bold", status.tone)}>
                {status.label}
              </span>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[11px] text-primary-foreground/60">Total</div>
                <div className="text-lg font-extrabold">{formatINR(rental.total_amount)}</div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inset-0 animate-ping rounded-full bg-success opacity-70" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-success" />
                </span>
                <span className="text-xs font-bold text-success">Live</span>
              </div>
            </div>
            <div className="mt-3">
              <div className="mb-1 flex justify-between text-[10px] text-primary-foreground/60">
                <span>Booking</span><span className="font-bold">{progress}%</span><span>Returned</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-gradient-accent transition-[width] duration-700" style={{ width: `${progress}%` }} />
              </div>
            </div>
          </div>
        </section>

        {/* Tabs */}
        <div className="sticky top-[57px] z-20 grid grid-cols-3 border-b border-border bg-card">
          {(["tracking", "details", "alerts"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "border-b-2 px-2 py-3 text-xs font-bold capitalize transition",
                tab === t ? "border-secondary text-secondary" : "border-transparent text-muted-foreground"
              )}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="px-4 pt-4">
          {tab === "tracking" && (
            <div className="animate-fade-in">
              {/* Timeline */}
              <h2 className="mb-3 text-sm font-bold">Delivery timeline</h2>
              <ol className="mb-5">
                {STEPS.map((step, idx) => {
                  const Icon = step.icon;
                  const done = idx < activeIdx;
                  const active = idx === activeIdx;
                  return (
                    <li key={step.key} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className={cn(
                          "relative grid h-9 w-9 place-items-center rounded-full border-2 transition",
                          active ? "border-secondary bg-secondary/10 text-secondary"
                                 : done ? "border-success bg-success/10 text-success"
                                        : "border-border bg-muted text-muted-foreground"
                        )}>
                          {active && <span className="absolute inset-[-4px] animate-ping rounded-full border-2 border-secondary opacity-50" />}
                          <Icon className="h-4 w-4" />
                        </div>
                        {idx < STEPS.length - 1 && (
                          <div className={cn("my-1 w-0.5 flex-1", done ? "bg-success" : "bg-border")} style={{ minHeight: 24 }} />
                        )}
                      </div>
                      <div className="flex-1 pb-5">
                        <div className={cn(
                          "text-sm",
                          active ? "font-bold text-secondary" : done ? "font-semibold text-foreground" : "font-medium text-muted-foreground"
                        )}>
                          {step.label}
                        </div>
                        <div className="text-xs text-muted-foreground">{step.sub}</div>
                      </div>
                    </li>
                  );
                })}
              </ol>

              {/* Schedule return */}
              <div className={cn(
                "mb-4 rounded-2xl border-2 border-dashed bg-card p-4",
                returnDone ? "border-success" : "border-border"
              )}>
                <div className="mb-3 flex items-center gap-2">
                  <Undo2 className="h-5 w-5 text-secondary" />
                  <div>
                    <div className="text-sm font-bold">Schedule return</div>
                    <div className="text-xs text-muted-foreground">Return by {rental.end_date} to avoid late fees</div>
                  </div>
                </div>
                {returnDone ? (
                  <div className="rounded-lg bg-success/10 px-3 py-2 text-sm font-bold text-success">
                    ✓ Return scheduled for {returnSlot}
                  </div>
                ) : (
                  <>
                    <div className="mb-2 grid grid-cols-2 gap-2">
                      {RETURN_SLOTS.map((s) => (
                        <button
                          key={s}
                          onClick={() => setReturnSlot(s)}
                          className={cn(
                            "rounded-lg border px-2 py-2 text-[11px] font-semibold transition",
                            returnSlot === s
                              ? "border-secondary bg-secondary/10 text-secondary"
                              : "border-border bg-muted/40 text-muted-foreground hover:bg-muted"
                          )}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                    <Button
                      disabled={!returnSlot}
                      onClick={() => setReturnDone(true)}
                      className="w-full rounded-full"
                      size="sm"
                    >
                      Confirm return slot
                    </Button>
                  </>
                )}
              </div>

              {/* Contact */}
              <div className="rounded-2xl border border-border bg-card p-4">
                <div className="mb-3 text-sm font-bold">Contact</div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-muted/40 p-3 text-center">
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">Owner</div>
                    <div className="mt-0.5 truncate text-sm font-bold">{owner?.full_name ?? "Owner"}</div>
                    <Button variant="outline" size="sm" className="mt-2 w-full gap-1.5 rounded-lg">
                      <Phone className="h-3.5 w-3.5" /> Call
                    </Button>
                  </div>
                  <div className="rounded-xl bg-muted/40 p-3 text-center">
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">Support</div>
                    <div className="mt-0.5 truncate text-sm font-bold">Rentify</div>
                    <Button variant="outline" size="sm" className="mt-2 w-full gap-1.5 rounded-lg">
                      <MessageCircle className="h-3.5 w-3.5" /> Chat
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === "details" && (
            <div className="animate-fade-in space-y-3">
              <div className="overflow-hidden rounded-2xl border border-border bg-card">
                {[
                  ["Booking ID", `#${rental.id.slice(0, 8).toUpperCase()}`],
                  ["Item", product?.title ?? "—"],
                  ["Rental period", `${rental.start_date} → ${rental.end_date}`],
                  ["Delivery", rental.delivery_option === "delivery" ? "Home delivery" : "Self pickup"],
                  ["Address", rental.delivery_address ?? (product?.location_city ?? "—")],
                  ["Owner", owner?.full_name ?? "—"],
                  ["Rental cost", formatINR(rental.total_amount)],
                  ["Deposit held", formatINR(rental.deposit)],
                  ["Booked on", new Date(rental.created_at).toLocaleDateString()],
                ].map(([k, v], i, arr) => (
                  <div key={k} className={cn("flex items-center justify-between px-4 py-3 text-sm", i < arr.length - 1 && "border-b border-border")}>
                    <span className="text-muted-foreground">{k}</span>
                    <span className="max-w-[55%] truncate text-right font-semibold">{v}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 gap-1.5 rounded-xl">
                  <Download className="h-4 w-4" /> Invoice
                </Button>
                <Button variant="outline" className="flex-1 gap-1.5 rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10">
                  <AlertTriangle className="h-4 w-4" /> Report
                </Button>
              </div>
              {product && (
                <Link to="/product/$id" params={{ id: product.id }}>
                  <Button variant="ghost" className="w-full gap-1.5 rounded-xl">
                    <MapPin className="h-4 w-4" /> View listing
                  </Button>
                </Link>
              )}
            </div>
          )}

          {tab === "alerts" && (
            <div className="animate-fade-in space-y-2.5">
              <div className="mb-1 text-sm font-bold">Recent alerts</div>
              {[
                { icon: "📍", text: `Status update: ${status.label}`, time: "Just now" },
                { icon: "📦", text: "Owner prepared your item", time: "1 hr ago" },
                { icon: "✅", text: `Booking confirmed #${rental.id.slice(0, 8).toUpperCase()}`, time: new Date(rental.created_at).toLocaleString() },
              ].map((n, i) => (
                <div key={i} className="flex items-start gap-3 rounded-xl border border-border bg-card p-3">
                  <div className="grid h-10 w-10 flex-none place-items-center rounded-full bg-muted text-lg">{n.icon}</div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold">{n.text}</div>
                    <div className="text-[11px] text-muted-foreground">{n.time}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}