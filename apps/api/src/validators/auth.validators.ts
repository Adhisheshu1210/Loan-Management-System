import { z } from "zod";
import { phoneNumberSchema } from "../shared/phone.js";

export const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: phoneNumberSchema,
  password: z.string().min(8).regex(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/, "Password must be strong"),
  role: z.enum(["ADMIN", "SALES", "SANCTION", "DISBURSEMENT", "COLLECTION", "BORROWER"]).optional(),
  challengeId: z.string().optional(),
  otp: z.string().regex(/^\d{6}$/).optional(),
});

export const loginSchema = z.object({
  identifier: z.string().min(3),
  password: z.string().min(1),
  challengeId: z.string().optional(),
  otp: z.string().regex(/^\d{6}$/).optional(),
});

export const forgotPasswordSchema = z.object({ email: z.string().email() });
export const resetPasswordSchema = z.object({ email: z.string().email(), token: z.string().min(8), password: z.string().min(8) });

export const secondaryEmailStartSchema = z.object({
  secondaryEmail: z.string().email(),
});

export const secondaryEmailVerifySchema = z.object({
  otp: z.string().regex(/^\d{6}$/),
});

export const changePhoneStartSchema = z.object({
  newPhone: phoneNumberSchema,
});

export const changePhoneVerifySchema = z.object({
  otp: z.string().regex(/^\d{6}$/),
});
