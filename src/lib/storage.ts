import { supabase } from "@/integrations/supabase/client";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

export interface UploadResult {
  url: string;
  path: string;
}

/** Sanitize a filename: keep it short, alphanumeric + dash/underscore + extension. */
function safeName(original: string): string {
  const dot = original.lastIndexOf(".");
  const ext = dot >= 0 ? original.slice(dot + 1).toLowerCase().replace(/[^a-z0-9]/g, "") : "jpg";
  const base = (dot >= 0 ? original.slice(0, dot) : original)
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40) || "image";
  const stamp = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `${stamp}-${rand}-${base}.${ext || "jpg"}`;
}

/** Validate then upload a single image to product-images/<userId>/<safeName>. */
export async function uploadProductImage(file: File, userId: string): Promise<UploadResult> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error("Only JPG, PNG, WEBP, or GIF images are allowed.");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("Image must be 5 MB or smaller.");
  }
  if (file.size === 0) {
    throw new Error("File is empty.");
  }
  const path = `${userId}/${safeName(file.name)}`;
  const { error } = await supabase.storage
    .from("product-images")
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from("product-images").getPublicUrl(path);
  return { url: data.publicUrl, path };
}