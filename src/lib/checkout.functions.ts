import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { checkoutPayloadSchema } from "@/lib/validation";
import type { Database } from "@/integrations/supabase/types";

type RentalInsert = Database["public"]["Tables"]["rentals"]["Insert"];
type OrderInsert = Database["public"]["Tables"]["orders"]["Insert"];

/**
 * Server-authoritative checkout.
 * - Verifies the caller via requireSupabaseAuth (RLS as that user).
 * - Re-fetches each product server-side; NEVER trusts client price values.
 * - Recomputes totals from the products table.
 * - Inserts rentals/orders. RLS + DB triggers enforce buyer != owner and
 *   write audit entries automatically.
 *
 * Rate-limiting recommendation: enforce per-user request limits via
 * Supabase Auth rate limits or an upstream WAF (e.g. Cloudflare rate
 * limiting on /_serverFn/*). A 60s, 5-request cap per user is reasonable.
 */
export const placeOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => checkoutPayloadSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    if (data.delivery_option === "delivery" && !data.delivery_address) {
      throw new Error("Delivery address is required for delivery option.");
    }

    const ids = Array.from(new Set(data.items.map((i) => i.product_id)));
    const { data: products, error: prodErr } = await supabase
      .from("products")
      .select("id, owner_id, status, listing_type, rent_price_day, sale_price, deposit")
      .in("id", ids);
    if (prodErr) throw new Error(prodErr.message);
    const byId = new Map((products ?? []).map((p) => [p.id, p]));

    const rentalRows: RentalInsert[] = [];
    const orderRows: OrderInsert[] = [];

    for (const item of data.items) {
      const p = byId.get(item.product_id);
      if (!p) throw new Error(`Product not found: ${item.product_id}`);
      if (p.status !== "active") throw new Error(`Product is not available: ${item.product_id}`);
      if (p.owner_id === userId) throw new Error("You cannot purchase your own listing.");

      if (item.mode === "rent") {
        if (p.listing_type === "sale") throw new Error("This item is not available for rent.");
        const perDay = Number(p.rent_price_day ?? 0);
        if (!perDay) throw new Error("Rent price not set for this item.");
        const days = item.days ?? 1;
        const start = new Date();
        const end = new Date();
        end.setDate(end.getDate() + days);
        rentalRows.push({
          product_id: p.id,
          renter_id: userId,
          owner_id: p.owner_id,
          start_date: start.toISOString().slice(0, 10),
          end_date: end.toISOString().slice(0, 10),
          total_amount: perDay * days * item.qty,
          deposit: Number(p.deposit ?? 0) * item.qty,
          delivery_option: data.delivery_option,
          delivery_address: data.delivery_option === "delivery" ? data.delivery_address ?? null : null,
        });
      } else {
        if (p.listing_type === "rent") throw new Error("This item is not available for purchase.");
        const price = Number(p.sale_price ?? 0);
        if (!price) throw new Error("Sale price not set for this item.");
        orderRows.push({
          product_id: p.id,
          buyer_id: userId,
          owner_id: p.owner_id,
          amount: price * item.qty,
          delivery_option: data.delivery_option,
          delivery_address: data.delivery_option === "delivery" ? data.delivery_address ?? null : null,
        });
      }
    }

    if (rentalRows.length) {
      const { error } = await supabase.from("rentals").insert(rentalRows);
      if (error) throw new Error(error.message);
    }
    if (orderRows.length) {
      const { error } = await supabase.from("orders").insert(orderRows);
      if (error) throw new Error(error.message);
    }

    return { ok: true, rentals: rentalRows.length, orders: orderRows.length };
  });