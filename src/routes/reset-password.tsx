import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetPasswordSchema, type ResetPasswordInput } from "@/lib/validation";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Choose a new password — Rentify" }] }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
  });

  // Supabase routes the recovery link through onAuthStateChange("PASSWORD_RECOVERY")
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    // Also accept if user already has an active session (link just opened)
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const onSubmit = async ({ password }: ResetPasswordInput) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return toast.error(error.message);
    toast.success("Password updated. Please sign in again.");
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 bg-gradient-hero" />
      <div className="relative grid min-h-screen place-items-center px-4 py-12">
        <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-elevated">
          <h1 className="text-2xl font-bold">Choose a new password</h1>
          {!ready ? (
            <p className="mt-4 text-sm text-muted-foreground">
              Open this page from the reset link in your email. If you didn't request a reset,{" "}
              <Link to="/login" className="font-semibold text-secondary hover:underline">go back to sign in</Link>.
            </p>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-3">
              <div>
                <Label htmlFor="password">New password</Label>
                <Input id="password" type="password" {...register("password")} />
                {errors.password && <p className="mt-1 text-xs text-destructive">{errors.password.message}</p>}
              </div>
              <div>
                <Label htmlFor="confirm">Confirm password</Label>
                <Input id="confirm" type="password" {...register("confirm")} />
                {errors.confirm && <p className="mt-1 text-xs text-destructive">{errors.confirm.message}</p>}
              </div>
              <Button type="submit" disabled={isSubmitting} className="w-full rounded-full">
                {isSubmitting ? "Updating…" : "Update password"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}