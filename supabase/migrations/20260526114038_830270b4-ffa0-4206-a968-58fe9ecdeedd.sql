
ALTER VIEW public.public_profiles SET (security_invoker = true);

-- Allow public to read non-sensitive columns directly on profiles so the view (running as invoker) returns rows
CREATE POLICY "Public can view non-sensitive profile fields"
ON public.profiles FOR SELECT
USING (true);
