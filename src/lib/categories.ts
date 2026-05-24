import {
  Smartphone, Shirt, Gamepad2, Wrench, Car, BookOpen, Camera, Home, PartyPopper,
  type LucideIcon,
} from "lucide-react";

export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  Smartphone, Shirt, Gamepad2, Wrench, Car, BookOpen, Camera, Home, PartyPopper,
};

export function iconFor(name: string | null | undefined): LucideIcon {
  if (!name) return Smartphone;
  return CATEGORY_ICONS[name] ?? Smartphone;
}