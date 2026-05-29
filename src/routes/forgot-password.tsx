import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/lib/validation";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Reset password — Rentify" }] }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async ({ email }: ForgotPasswordInput) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) return toast.error(error.message);
    setSent(true);
    toast.success("Check your inbox for a reset link.");
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 bg-gradient-hero" />
      <div className="relative grid min-h-screen place-items-center px-4 py-12">
        <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-elevated">
          <h1 className="text-2xl font-bold">Forgot password?</h1>
          <p className="mt-1 text-sm text-muted-foreground">We'll email you a secure reset link.</p>

          {sent ? (
            <div className="mt-6 rounded-2xl border border-border bg-muted/40 p-4 text-sm">
              Email sent. Open the link from your inbox to choose a new password.
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-3">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" {...register("email")} />
                {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>}
              </div>
              <Button type="submit" disabled={isSubmitting} className="w-full rounded-full">
                {isSubmitting ? "Sending…" : "Send reset link"}
              </Button>
            </form>
          )}

          <p className="mt-5 text-center text-sm text-muted-foreground">
            Back to{" "}
            <Link to="/login" className="font-semibold text-secondary hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}