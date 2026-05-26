
-- Remove blanket table grants and re-grant only safe columns to anon/authenticated.
-- Owners reading their own row go through the owner policy + service role / auth context with full column access via authenticated grants below.
REVOKE SELECT ON public.profiles FROM anon, authenticated;

GRANT SELECT (id, display_name, avatar_url, rating, is_verified)
  ON public.profiles TO anon, authenticated;

-- Owners need to read their own sensitive columns too. Grant the sensitive columns
-- to authenticated; RLS still restricts which ROWS they can see (only their own,
-- via the "Owners can view their own full profile" policy combined with the
-- public non-sensitive policy).
GRANT SELECT (phone, city, area, pincode, created_at, updated_at)
  ON public.profiles TO authenticated;
