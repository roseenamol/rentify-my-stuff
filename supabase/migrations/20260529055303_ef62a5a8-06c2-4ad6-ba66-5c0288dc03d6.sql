
-- Bucket: replace broad public SELECT with owner-only listing.
-- Public file contents are still served via the public URL regardless of RLS.
DROP POLICY IF EXISTS "Product images publicly readable" ON storage.objects;

CREATE POLICY "Owners list own product-images"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'product-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Revoke EXECUTE on SECURITY DEFINER helpers; triggers run regardless.
REVOKE EXECUTE ON FUNCTION public.log_audit_event(text, text, uuid, uuid, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.audit_products_changes() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.audit_rentals_changes() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.audit_orders_changes() FROM PUBLIC, anon, authenticated;
