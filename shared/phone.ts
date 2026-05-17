import { z } from "zod";

export function normalizePhoneNumber(value: string) {
  return value.replace(/\D/g, "");
}

export function canonicalizePhoneNumber(value: string) {
  const digits = normalizePhoneNumber(value);
  if (digits.length === 12 && digits.startsWith("91")) {
    return digits.slice(2);
  }

  return digits;
}

export function isValidPhoneNumber(value: string) {
  return canonicalizePhoneNumber(value).length === 10;
}

export function toE164PhoneNumber(value: string) {
  // If already E.164, return as-is
  if (typeof value === "string" && value.trim().startsWith("+")) {
    const cleaned = value.trim();
    // basic validation
    if (/^\+\d{6,15}$/.test(cleaned)) return cleaned;
  }

  const digits = normalizePhoneNumber(value);
  // Treat 10-digit numbers as India local numbers
  if (digits.length === 10) {
    return `+91${digits}`;
  }

  // If digits longer than 10, assume it includes a country code
  if (digits.length > 10) {
    return `+${digits}`;
  }

  return "";
}

export const phoneNumberSchema = z
  .string()
  .trim()
  .refine((value) => isValidPhoneNumber(value), { message: "Enter a valid phone number" })
  .transform((value) => canonicalizePhoneNumber(value));