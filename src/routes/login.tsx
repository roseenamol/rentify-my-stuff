import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginSchema, type LoginInput } from "@/lib/validation";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — Rentify" }, { name: "description", content: "Sign in to Rentify to rent and list items." }] }),
  component: LoginPage,
});

const COOLDOWN_KEY = "rentify-login-cooldown";
const MAX_ATTEMPTS = 5;
const COOLDOWN_SECONDS = 30;

function LoginPage() {
  const navigate = useNavigate();
  const [cooldown, setCooldown] = useState(0);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  // Tick down any active cooldown.
  useEffect(() => {
    const raw = localStorage.getItem(COOLDOWN_KEY);
    if (!raw) return;
    try {
      const { until } = JSON.parse(raw) as { until: number };
      const tick = () => {
        const left = Math.max(0, Math.ceil((until - Date.now()) / 1000));
        setCooldown(left);
        if (left === 0) localStorage.removeItem(COOLDOWN_KEY);
      };
      tick();
      const t = setInterval(tick, 1000);
      return () => clearInterval(t);
    } catch { /* ignore */ }
  }, []);

  const recordFailure = () => {
    const rawAttempts = sessionStorage.getItem("rentify-login-attempts");
    const attempts = (rawAttempts ? parseInt(rawAttempts, 10) : 0) + 1;
    sessionStorage.setItem("rentify-login-attempts", String(attempts));
    if (attempts >= MAX_ATTEMPTS) {
      const until = Date.now() + COOLDOWN_SECONDS * 1000;
      localStorage.setItem(COOLDOWN_KEY, JSON.stringify({ until }));
      setCooldown(COOLDOWN_SECONDS);
      sessionStorage.removeItem("rentify-login-attempts");
    }
  };

  const onSubmit = async ({ email, password }: LoginInput) => {
    if (cooldown > 0) return;
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      recordFailure();
      return toast.error(error.message);
    }
    sessionStorage.removeItem("rentify-login-attempts");
    toast.success("Welcome back!");
    navigate({ to: "/" });
  };

  const onGoogle = async () => {
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) return toast.error(result.error.message);
    if (result.redirected) return;
    navigate({ to: "/" });
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 bg-gradient-hero" />
      <div className="relative grid min-h-screen place-items-center px-4 py-12">
        <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-elevated">
          <Link to="/" className="mb-6 flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-accent text-lg font-black text-primary-foreground">R</span>
            <span className="text-xl font-black">Rentify</span>
          </Link>
          <h1 className="text-2xl font-bold">Welcome back</h1>
          <p className="mt-1 text-sm text-muted-foreground">Sign in to rent or list items.</p>

          <Button variant="outline" onClick={onGoogle} className="mt-6 w-full rounded-full" type="button">
            <GoogleMark /> Continue with Google
          </Button>

          <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-wider text-muted-foreground">
            <div className="h-px flex-1 bg-border" />or<div className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3" noValidate>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" autoComplete="email" {...register("email")} />
              {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link to="/forgot-password" className="text-xs font-semibold text-secondary hover:underline">Forgot?</Link>
              </div>
              <Input id="password" type="password" autoComplete="current-password" {...register("password")} />
              {errors.password && <p className="mt-1 text-xs text-destructive">{errors.password.message}</p>}
            </div>
            <Button type="submit" disabled={isSubmitting || cooldown > 0} className="w-full rounded-full">
              {cooldown > 0 ? `Try again in ${cooldown}s` : isSubmitting ? "Signing in…" : "Sign in"}
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-muted-foreground">
            New to Rentify?{" "}
            <Link to="/signup" className="font-semibold text-secondary hover:underline">Create an account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg className="mr-2 h-4 w-4" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.5 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.1 35.3 26.6 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.4 16.2 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.1 5.6l6.2 5.2c-.4.4 6.6-4.8 6.6-14.8 0-1.3-.1-2.4-.4-3.5z"/>
    </svg>
  );
}