
-- Restrict public access to sensitive profile fields (phone, city, area, pincode)
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

CREATE POLICY "Owners can view their own full profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

-- Public-safe view exposing only non-sensitive fields for browsing other users
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT id, display_name, avatar_url, rating, is_verified
FROM public.profiles;

GRANT SELECT ON public.public_profiles TO anon, authenticated;
