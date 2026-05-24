import { useState } from "react";
import { MapPin } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocation } from "@/hooks/use-location";

const POPULAR = ["Mumbai", "Delhi", "Bengaluru", "Hyderabad", "Pune", "Chennai", "Kolkata", "Ahmedabad"];

export function LocationPicker({ compact = false }: { compact?: boolean }) {
  const { location, setLocation } = useLocation();
  const [open, setOpen] = useState(false);
  const [city, setCity] = useState(location?.city ?? "");
  const [area, setArea] = useState(location?.area ?? "");
  const [pincode, setPincode] = useState(location?.pincode ?? "");

  const save = () => {
    if (!city.trim()) return;
    setLocation({ city: city.trim(), area: area.trim() || undefined, pincode: pincode.trim() || undefined });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-1.5 text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
        >
          <MapPin className="h-4 w-4 text-secondary" />
          {compact ? (
            <span className="truncate max-w-[8rem]">{location?.city ?? "Set location"}</span>
          ) : (
            <span className="flex flex-col items-start leading-tight">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Deliver to</span>
              <span className="truncate max-w-[10rem]">{location?.city ?? "Set your area"}</span>
            </span>
          )}
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Where are you renting?</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {POPULAR.map((c) => (
              <button
                key={c}
                onClick={() => setCity(c)}
                className={`rounded-full border px-3 py-1.5 text-sm transition hover:border-secondary hover:bg-secondary/10 ${city === c ? "border-secondary bg-secondary/10 text-secondary-foreground" : "border-border"}`}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="grid gap-3">
            <div>
              <Label htmlFor="city">City</Label>
              <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Mumbai" />
            </div>
            <div>
              <Label htmlFor="area">Area / Locality</Label>
              <Input id="area" value={area} onChange={(e) => setArea(e.target.value)} placeholder="e.g. Bandra West" />
            </div>
            <div>
              <Label htmlFor="pin">Pincode</Label>
              <Input id="pin" value={pincode} onChange={(e) => setPincode(e.target.value)} placeholder="e.g. 400050" maxLength={6} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={save} disabled={!city.trim()} className="w-full">Save location</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}