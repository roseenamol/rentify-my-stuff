import { z } from "zod";

export const emailSchema = z.string().trim().toLowerCase().email("Enter a valid email").max(255);

export const passwordSchema = z
  .string()
  .min(8, "At least 8 characters")
  .max(128, "Too long")
  .regex(/[a-z]/, "Add a lowercase letter")
  .regex(/[A-Z]/, "Add an uppercase letter")
  .regex(/[0-9]/, "Add a number");

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required").max(128),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const signupSchema = z
  .object({
    name: z.string().trim().min(2, "Name is too short").max(80),
    email: emailSchema,
    password: passwordSchema,
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    path: ["confirm"],
    message: "Passwords do not match",
  });
export type SignupInput = z.infer<typeof signupSchema>;

export const forgotPasswordSchema = z.object({ email: emailSchema });
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({ password: passwordSchema, confirm: z.string() })
  .refine((d) => d.password === d.confirm, {
    path: ["confirm"],
    message: "Passwords do not match",
  });
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const profileSchema = z.object({
  display_name: z.string().trim().min(2).max(80),
  phone: z
    .string()
    .trim()
    .regex(/^[+0-9\s-]{7,20}$/u, "Enter a valid phone")
    .optional()
    .or(z.literal("")),
  city: z.string().trim().max(80).optional().or(z.literal("")),
  area: z.string().trim().max(120).optional().or(z.literal("")),
  pincode: z
    .string()
    .trim()
    .regex(/^\d{4,10}$/u, "Enter a valid pincode")
    .optional()
    .or(z.literal("")),
});
export type ProfileInput = z.infer<typeof profileSchema>;

// Checkout payload — used by client AND by server fn validator
export const checkoutItemSchema = z.object({
  product_id: z.string().uuid(),
  mode: z.enum(["rent", "buy"]),
  qty: z.number().int().min(1).max(20),
  days: z.number().int().min(1).max(365).optional(),
});
export const checkoutPayloadSchema = z.object({
  delivery_option: z.enum(["pickup", "delivery"]),
  delivery_address: z.string().trim().min(5).max(500).optional().nullable(),
  items: z.array(checkoutItemSchema).min(1).max(20),
});
export type CheckoutPayload = z.infer<typeof checkoutPayloadSchema>;