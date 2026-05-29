import { createFileRoute, redirect, Outlet, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

/**
 * Centralized auth guard for every protected page.
 *
 * `beforeLoad` runs before the route renders, so unauthenticated visitors
 * are redirected to /login WITHOUT a flash of protected content. We call
 * `supabase.auth.getUser()` so the JWT is revalidated, not just read from
 * cookies — this also waits for the session to hydrate on a hard refresh.
 */
export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async ({ location }) => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({
        to: "/login",
        search: { redirect: location.href },
      });
    }
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { loading, user } = useAuth();

  // While the session is still hydrating in-tab, show a tiny skeleton so
  // child components that need `user` don't render with null.
  if (loading || !user) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
          Checking your session…
        </div>
      </div>
    );
  }
  return <Outlet />;
}

// re-export for unused-import linting tolerance
export { Link };