ALTER FUNCTION public.rentals_prevent_immutable_changes() SECURITY INVOKER;
ALTER FUNCTION public.orders_prevent_immutable_changes() SECURITY INVOKER;
REVOKE EXECUTE ON FUNCTION public.rentals_prevent_immutable_changes() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.orders_prevent_immutable_changes() FROM PUBLIC, anon, authenticated;