import { z } from "zod";

export const paymentSchema = z.object({
  loanId: z.string().min(1),
  amount: z.number().positive(),
  utrNumber: z.string().min(4),
  paymentDate: z.string().refine((value) => !Number.isNaN(Date.parse(value)), "Invalid date"),
});
