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

export const TRANSACTION_TYPES = ["purchase", "payment", "interest", "fee"] as const;

// Amount is always entered as a positive number; the server applies the sign from `type`
const transactionFields = z.object({
  date: z.coerce.date({ error: "Enter a valid date" }),
  postDate: z.coerce.date({ error: "Enter a valid post date" }),
  description: z
    .string()
    .trim()
    .min(1, "Description is required")
    .max(200, "Description must be 200 characters or less"),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  type: z.enum(TRANSACTION_TYPES),
});

const postDateNotBeforeDate = (data: { date: Date; postDate: Date }) =>
  data.postDate >= data.date;

const postDateIssue = {
  message: "Post date can't be before the transaction date",
  path: ["postDate"],
};

export const transactionUpdateSchema = transactionFields.refine(
  postDateNotBeforeDate,
  postDateIssue
);

export const transactionSchema = transactionFields
  .extend({ statementId: z.string().min(1, "Statement is required") })
  .refine(postDateNotBeforeDate, postDateIssue);

export type CreditCardInput = z.infer<typeof creditCardSchema>;
export type OverrideInput = z.infer<typeof overrideSchema>;
export type StatementInput = z.infer<typeof statementSchema>;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];
export type TransactionInput = z.infer<typeof transactionSchema>;
export type TransactionFormValues = z.input<typeof transactionUpdateSchema>;
export type TransactionUpdateInput = z.output<typeof transactionUpdateSchema>;
