import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Plus, X, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "@/hooks/use-location";

export const Route = createFileRoute("/list-item")({
  head: () => ({ meta: [{ title: "List your item — Rentify" }] }),
  component: ListItemPage,
});

function ListItemPage() {
  const { user, loading } = useAuth();
  const { location } = useLocation();
  const navigate = useNavigate();

  const { data: categories = [] } = useQuery({
    queryKey: ["categories-full"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, subcategories(id, name)")
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const [form, setForm] = useState({
    title: "", description: "", condition: "Good",
    listing_type: "rent" as "rent" | "sale" | "both",
    rent_price_day: "", rent_price_week: "", sale_price: "", deposit: "",
    category_id: "", subcategory_id: "",
    city: location?.city ?? "", area: location?.area ?? "", pincode: location?.pincode ?? "",
    delivery_available: false,
    image_url: "",
  });
  const [images, setImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  if (!loading && !user) {
    throw redirect({ to: "/login" });
  }

  const selectedCat = categories.find((c: { id: string }) => c.id === form.category_id);

  const addImage = () => {
    const url = form.image_url.trim();
    if (!url) return;
    setImages((p) => [...p, url]);
    setForm((f) => ({ ...f, image_url: "" }));
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    const payload = {
      owner_id: user.id,
      title: form.title.trim(),
      description: form.description.trim() || null,
      condition: form.condition,
      listing_type: form.listing_type,
      rent_price_day: form.rent_price_day ? Number(form.rent_price_day) : null,
      rent_price_week: form.rent_price_week ? Number(form.rent_price_week) : null,
      sale_price: form.sale_price ? Number(form.sale_price) : null,
      deposit: form.deposit ? Number(form.deposit) : 0,
      category_id: form.category_id || null,
      subcategory_id: form.subcategory_id || null,
      city: form.city || null, area: form.area || null, pincode: form.pincode || null,
      delivery_available: form.delivery_available,
      images,
      status: "active" as const,
    };
    const { data, error } = await supabase.from("products").insert(payload).select("id").maybeSingle();
    setSubmitting(false);
    if (error) return toast.error(error.message);
    toast.success("Listing created!");
    if (data?.id) navigate({ to: "/product/$id", params: { id: data.id } });
    else navigate({ to: "/dashboard" });
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl px-4 py-8 lg:px-6">
        <h1 className="text-3xl font-black">List your item</h1>
        <p className="mt-1 text-sm text-muted-foreground">It takes 2 minutes. Start earning from your idle stuff.</p>

        <form onSubmit={onSubmit} className="mt-8 space-y-6">
          <Section title="Basics">
            <Field label="Title" required>
              <Input value={form.title} onChange={(e) => setForm({...form, title: e.target.value})} required placeholder="e.g. Canon EOS 80D DSLR Camera" />
            </Field>
            <Field label="Description">
              <Textarea rows={4} value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} placeholder="Specs, included accessories, usage rules…" />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Category">
                <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.category_id}
                  onChange={(e) => setForm({...form, category_id: e.target.value, subcategory_id: ""})}>
                  <option value="">Select category</option>
                  {categories.map((c: { id: string; name: string }) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </Field>
              <Field label="Subcategory">
                <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.subcategory_id}
                  onChange={(e) => setForm({...form, subcategory_id: e.target.value})} disabled={!selectedCat}>
                  <option value="">Select subcategory</option>
                  {selectedCat?.subcategories?.map((s: { id: string; name: string }) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </Field>
            </div>
            <Field label="Condition">
              <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.condition} onChange={(e) => setForm({...form, condition: e.target.value})}>
                <option>Brand new</option><option>Like new</option><option>Good</option><option>Fair</option>
              </select>
            </Field>
          </Section>

          <Section title="Photos">
            <div className="flex gap-2">
              <Input value={form.image_url} onChange={(e) => setForm({...form, image_url: e.target.value})} placeholder="Paste image URL" />
              <Button type="button" onClick={addImage} variant="outline"><Upload className="mr-1 h-4 w-4" />Add</Button>
            </div>
            {images.length > 0 && (
              <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
                {images.map((img, i) => (
                  <div key={i} className="relative aspect-square overflow-hidden rounded-xl border border-border">
                    <img src={img} alt="" className="h-full w-full object-cover" />
                    <button type="button" onClick={() => setImages((p) => p.filter((_,j) => j!==i))}
                      className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-background/90 text-foreground shadow-soft">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Section>

          <Section title="Pricing">
            <Field label="Listing type">
              <div className="flex gap-2">
                {(["rent","sale","both"] as const).map((t) => (
                  <button type="button" key={t} onClick={() => setForm({...form, listing_type: t})}
                    className={`flex-1 rounded-full border px-3 py-2 text-sm font-semibold capitalize ${form.listing_type === t ? "border-secondary bg-secondary text-secondary-foreground" : "border-border"}`}>
                    {t === "both" ? "Rent + Sell" : t}
                  </button>
                ))}
              </div>
            </Field>
            {form.listing_type !== "sale" && (
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="₹ / day"><Input type="number" min={0} value={form.rent_price_day} onChange={(e) => setForm({...form, rent_price_day: e.target.value})} /></Field>
                <Field label="₹ / week"><Input type="number" min={0} value={form.rent_price_week} onChange={(e) => setForm({...form, rent_price_week: e.target.value})} /></Field>
                <Field label="Deposit"><Input type="number" min={0} value={form.deposit} onChange={(e) => setForm({...form, deposit: e.target.value})} /></Field>
              </div>
            )}
            {form.listing_type !== "rent" && (
              <Field label="Selling price (₹)">
                <Input type="number" min={0} value={form.sale_price} onChange={(e) => setForm({...form, sale_price: e.target.value})} />
              </Field>
            )}
          </Section>

          <Section title="Location & delivery">
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="City"><Input value={form.city} onChange={(e) => setForm({...form, city: e.target.value})} /></Field>
              <Field label="Area"><Input value={form.area} onChange={(e) => setForm({...form, area: e.target.value})} /></Field>
              <Field label="Pincode"><Input value={form.pincode} onChange={(e) => setForm({...form, pincode: e.target.value})} maxLength={6} /></Field>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.delivery_available} onChange={(e) => setForm({...form, delivery_available: e.target.checked})} />
              Offer doorstep delivery
            </label>
          </Section>

          <Button type="submit" disabled={submitting} size="lg" className="w-full rounded-full">
            <Plus className="mr-2 h-4 w-4" /> {submitting ? "Publishing…" : "Publish listing"}
          </Button>
        </form>
      </div>
    </AppLayout>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <h2 className="mb-4 text-lg font-bold">{title}</h2>
      <div className="space-y-4">{children}</div>
    </div>
  );
}
function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <Label>{label}{required && <span className="text-destructive"> *</span>}</Label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}