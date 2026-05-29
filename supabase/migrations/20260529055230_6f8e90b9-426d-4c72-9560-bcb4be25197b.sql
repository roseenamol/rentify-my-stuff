
-- =========================
-- Audit logs
-- =========================
CREATE TABLE public.audit_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid,
  action text NOT NULL,
  target_table text,
  target_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_logs_user_created ON public.audit_logs (user_id, created_at DESC);
CREATE INDEX idx_audit_logs_action ON public.audit_logs (action);

GRANT SELECT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Users can read only their own audit entries
CREATE POLICY "Users read own audit logs"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- No direct INSERT/UPDATE/DELETE policies — only SECURITY DEFINER triggers write here.

-- Generic audit writer used by triggers
CREATE OR REPLACE FUNCTION public.log_audit_event(
  _action text,
  _target_table text,
  _target_id uuid,
  _user_id uuid,
  _metadata jsonb
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.audit_logs (user_id, action, target_table, target_id, metadata)
  VALUES (_user_id, _action, _target_table, _target_id, COALESCE(_metadata, '{}'::jsonb));
END;
$$;

-- Products audit trigger
CREATE OR REPLACE FUNCTION public.audit_products_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.log_audit_event(
      'product_created', 'products', NEW.id, NEW.owner_id,
      jsonb_build_object('title', NEW.title, 'listing_type', NEW.listing_type, 'status', NEW.status)
    );
  ELSIF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    PERFORM public.log_audit_event(
      'product_status_changed', 'products', NEW.id, NEW.owner_id,
      jsonb_build_object('from', OLD.status, 'to', NEW.status)
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_audit_products
AFTER INSERT OR UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.audit_products_changes();

-- Rentals audit trigger
CREATE OR REPLACE FUNCTION public.audit_rentals_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.log_audit_event(
      'rental_created', 'rentals', NEW.id, NEW.renter_id,
      jsonb_build_object(
        'product_id', NEW.product_id,
        'owner_id', NEW.owner_id,
        'total_amount', NEW.total_amount,
        'deposit', NEW.deposit,
        'start_date', NEW.start_date,
        'end_date', NEW.end_date
      )
    );
  ELSIF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    PERFORM public.log_audit_event(
      'rental_status_changed', 'rentals', NEW.id, auth.uid(),
      jsonb_build_object('from', OLD.status, 'to', NEW.status)
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_audit_rentals
AFTER INSERT OR UPDATE ON public.rentals
FOR EACH ROW EXECUTE FUNCTION public.audit_rentals_changes();

-- Orders audit trigger
CREATE OR REPLACE FUNCTION public.audit_orders_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.log_audit_event(
      'order_created', 'orders', NEW.id, NEW.buyer_id,
      jsonb_build_object('product_id', NEW.product_id, 'owner_id', NEW.owner_id, 'amount', NEW.amount)
    );
  ELSIF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    PERFORM public.log_audit_event(
      'order_status_changed', 'orders', NEW.id, auth.uid(),
      jsonb_build_object('from', OLD.status, 'to', NEW.status)
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_audit_orders
AFTER INSERT OR UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.audit_orders_changes();

-- =========================
-- Storage: product-images bucket
-- =========================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images', 'product-images', true, 5242880,
  ARRAY['image/jpeg','image/png','image/webp','image/gif']
)
ON CONFLICT (id) DO UPDATE
  SET public = EXCLUDED.public,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Public read
CREATE POLICY "Product images publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

-- Authenticated users can upload within their own user-id folder
CREATE POLICY "Users upload to own product-images folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users update own product-images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'product-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users delete own product-images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'product-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
