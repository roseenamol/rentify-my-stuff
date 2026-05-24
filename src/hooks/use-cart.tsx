import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export interface CartItem {
  productId: string;
  title: string;
  image?: string;
  mode: "rent" | "buy";
  pricePerDay?: number;
  salePrice?: number;
  deposit?: number;
  days?: number;
  qty: number;
}

interface CartCtx {
  items: CartItem[];
  add: (item: CartItem) => void;
  remove: (productId: string, mode: "rent" | "buy") => void;
  clear: () => void;
  count: number;
  subtotal: number;
  depositTotal: number;
}

const Ctx = createContext<CartCtx>({
  items: [], add: () => {}, remove: () => {}, clear: () => {},
  count: 0, subtotal: 0, depositTotal: 0,
});

const KEY = "rentify-cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    const raw = localStorage.getItem(KEY);
    if (raw) try { setItems(JSON.parse(raw)); } catch {}
  }, []);
  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(items)); }, [items]);

  const add = (item: CartItem) =>
    setItems((prev) => {
      const idx = prev.findIndex((p) => p.productId === item.productId && p.mode === item.mode);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], qty: next[idx].qty + item.qty, days: item.days ?? next[idx].days };
        return next;
      }
      return [...prev, item];
    });
  const remove = (productId: string, mode: "rent" | "buy") =>
    setItems((prev) => prev.filter((p) => !(p.productId === productId && p.mode === mode)));
  const clear = () => setItems([]);

  const subtotal = items.reduce((sum, i) =>
    sum + (i.mode === "rent" ? (i.pricePerDay ?? 0) * (i.days ?? 1) * i.qty : (i.salePrice ?? 0) * i.qty), 0);
  const depositTotal = items.reduce((sum, i) =>
    sum + (i.mode === "rent" ? (i.deposit ?? 0) * i.qty : 0), 0);

  return (
    <Ctx.Provider value={{ items, add, remove, clear, count: items.reduce((s,i)=>s+i.qty,0), subtotal, depositTotal }}>
      {children}
    </Ctx.Provider>
  );
}

export const useCart = () => useContext(Ctx);