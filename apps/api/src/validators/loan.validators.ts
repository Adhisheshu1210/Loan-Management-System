import { z } from "zod";

export const loanActionSchema = z.object({
  notes: z.string().optional(),
  reason: z.string().optional(),
  transactionReference: z.string().optional(),
});
