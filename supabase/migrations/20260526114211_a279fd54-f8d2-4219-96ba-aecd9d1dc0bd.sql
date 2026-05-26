
-- Drop the permissive public policy that re-exposed all rows
DROP POLICY IF EXISTS "Public can view non-sensitive profile fields" ON public.profiles;

-- Restore full table grant for authenticated (RLS will restrict rows to owner-only)
GRANT SELECT ON public.profiles TO authenticated;
REVOKE SELECT ON public.profiles FROM anon;

-- Make the public-safe view run as definer so anyone can read safe fields about any user
ALTER VIEW public.public_profiles SET (security_invoker = false);
GRANT SELECT ON public.public_profiles TO anon, authenticated;
