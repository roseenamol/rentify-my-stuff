
-- 1) Fix SECURITY DEFINER view: use security_invoker
ALTER VIEW public.public_profiles SET (security_invoker = true);

-- 2) Orders: validate owner_id matches product owner on INSERT
DROP POLICY IF EXISTS "Buyer creates order" ON public.orders;
CREATE POLICY "Buyer creates order"
ON public.orders
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = buyer_id
  AND owner_id = (SELECT p.owner_id FROM public.products p WHERE p.id = product_id)
  AND buyer_id <> owner_id
);

-- 3) Rentals: validate owner_id matches product owner on INSERT
DROP POLICY IF EXISTS "Renter creates rental" ON public.rentals;
CREATE POLICY "Renter creates rental"
ON public.rentals
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = renter_id
  AND owner_id = (SELECT p.owner_id FROM public.products p WHERE p.id = product_id)
  AND renter_id <> owner_id
);

-- 4) Products: only active visible publicly; owners see all their non-deleted
DROP POLICY IF EXISTS "Active products are viewable by everyone" ON public.products;

CREATE POLICY "Active products are publicly viewable"
ON public.products
FOR SELECT
TO anon, authenticated
USING (status = 'active');

CREATE POLICY "Owners can view their own products"
ON public.products
FOR SELECT
TO authenticated
USING (auth.uid() = owner_id);
