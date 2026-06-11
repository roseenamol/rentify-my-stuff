-- RENTALS: restrict update to owner only, and lock immutable fields via trigger
DROP POLICY IF EXISTS "Renter or owner can update rental" ON public.rentals;

CREATE POLICY "Owner can update rental"
  ON public.rentals
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE OR REPLACE FUNCTION public.rentals_prevent_immutable_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.product_id   IS DISTINCT FROM OLD.product_id
  OR NEW.renter_id    IS DISTINCT FROM OLD.renter_id
  OR NEW.owner_id     IS DISTINCT FROM OLD.owner_id
  OR NEW.total_amount IS DISTINCT FROM OLD.total_amount
  OR NEW.deposit      IS DISTINCT FROM OLD.deposit
  OR NEW.start_date   IS DISTINCT FROM OLD.start_date
  OR NEW.end_date     IS DISTINCT FROM OLD.end_date
  OR NEW.created_at   IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'Rental financial, party, date, and creation fields are immutable';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS rentals_prevent_immutable_changes ON public.rentals;
CREATE TRIGGER rentals_prevent_immutable_changes
  BEFORE UPDATE ON public.rentals
  FOR EACH ROW EXECUTE FUNCTION public.rentals_prevent_immutable_changes();

-- ORDERS: restrict update to owner only, and lock immutable fields via trigger
DROP POLICY IF EXISTS "Buyer or owner can update order" ON public.orders;

CREATE POLICY "Owner can update order"
  ON public.orders
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE OR REPLACE FUNCTION public.orders_prevent_immutable_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.product_id IS DISTINCT FROM OLD.product_id
  OR NEW.buyer_id   IS DISTINCT FROM OLD.buyer_id
  OR NEW.owner_id   IS DISTINCT FROM OLD.owner_id
  OR NEW.amount     IS DISTINCT FROM OLD.amount
  OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'Order financial, party, and creation fields are immutable';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS orders_prevent_immutable_changes ON public.orders;
CREATE TRIGGER orders_prevent_immutable_changes
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.orders_prevent_immutable_changes();