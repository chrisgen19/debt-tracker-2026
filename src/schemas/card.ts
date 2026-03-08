import { z } from "zod";

export const creditCardSchema = z.object({
  name: z.string().min(1, "Card name is required"),
  bankName: z.string().min(1, "Bank name is required"),
  creditLimit: z.coerce.number().positive("Credit limit must be positive"),
  currentBalance: z.coerce.number().min(0, "Balance cannot be negative"),
  interestRate: z.coerce.number().min(0).max(1, "Interest rate must be a decimal (e.g. 0.03)"),
  computation: z.enum(["BPI", "STANDARD"]),
  minPayment: z.coerce.number().min(0),
  targetPayment: z.coerce.number().positive("Target payment must be positive"),
  color: z.string().default("#3b82f6"),
  statementDay: z.coerce.number().int().min(1).max(31).default(9),
  dueDateDay: z.coerce.number().int().min(1).max(31).default(2),
});

export const overrideSchema = z.object({
  creditCardId: z.string(),
  monthNumber: z.coerce.number().int().positive(),
  payment: z.coerce.number().min(0).nullable().optional(),
  purchases: z.coerce.number().min(0).nullable().optional(),
});

export const statementSchema = z.object({
  creditCardId: z.string(),
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int(),
  statementDate: z.coerce.date(),
  dueDate: z.coerce.date(),
  previousBalance: z.coerce.number(),
  payments: z.coerce.number().min(0).default(0),
  purchases: z.coerce.number().min(0).default(0),
  interestCharged: z.coerce.number().min(0).default(0),
  fees: z.coerce.number().min(0).default(0),
  endingBalance: z.coerce.number(),
  minimumDue: z.coerce.number().min(0),
  isPaid: z.boolean().default(false),
  amountPaid: z.coerce.number().min(0).default(0),
  notes: z.string().optional(),
});

export type CreditCardInput = z.infer<typeof creditCardSchema>;
export type OverrideInput = z.infer<typeof overrideSchema>;
export type StatementInput = z.infer<typeof statementSchema>;
