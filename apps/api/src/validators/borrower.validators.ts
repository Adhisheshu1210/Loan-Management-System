import { z } from "zod";
import { phoneNumberSchema } from "../shared/phone.js";

export const borrowerProfileSchema = z.object({
  name: z.string().min(2).optional(),
  phone: phoneNumberSchema.optional(),
  pan: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/),
  dob: z.string().refine((value) => !Number.isNaN(Date.parse(value)), "Invalid date"),
  salary: z.number().min(0),
  employmentMode: z.enum(["Salaried", "Self-Employed", "Unemployed"]),
  address: z.string().min(3),
  city: z.string().min(2),
  state: z.string().min(2),
  pincode: z.string().min(4),
});

export const applyLoanSchema = z.object({
  amount: z.number().min(50000).max(500000),
  tenure: z.number().min(30).max(365),
});

export const borrowerAuthSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(10),
  password: z.string().min(8),
  mode: z.enum(["register", "login"]),
});

export const phoneVerificationStartSchema = z.object({
  phone: phoneNumberSchema,
});

export const phoneVerificationVerifySchema = z.object({
  otp: z.string().regex(/^\d{6}$/),
});
