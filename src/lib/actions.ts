"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  creditCardSchema,
  overrideSchema,
  statementSchema,
  transactionSchema,
  transactionUpdateSchema,
} from "@/schemas/card";
import {
  computeEndingBalance,
  summarizeTransactions,
  toSignedAmount,
} from "@/lib/statement-totals";
import { revalidatePath } from "next/cache";

async function getUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user.id;
}

// --- Credit Cards ---

export async function getCards() {
  const userId = await getUserId();
  return prisma.creditCard.findMany({
    where: { userId },
    include: {
      overrides: true,
      statements: { orderBy: [{ year: "desc" }, { month: "desc" }] },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function createCard(formData: FormData) {
  const userId = await getUserId();
  const raw = Object.fromEntries(formData);
  const parsed = creditCardSchema.safeParse(raw);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  await prisma.creditCard.create({
    data: { ...parsed.data, userId },
  });

  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateCard(id: string, data: Record<string, unknown>) {
  const userId = await getUserId();

  // Verify ownership
  const card = await prisma.creditCard.findFirst({ where: { id, userId } });
  if (!card) return { error: "Card not found" };

  const updateData: Record<string, unknown> = {};
  if (data.targetPayment !== undefined)
    updateData.targetPayment = Number(data.targetPayment);
  if (data.currentBalance !== undefined)
    updateData.currentBalance = Number(data.currentBalance);
  if (data.name !== undefined) updateData.name = String(data.name);
  if (data.color !== undefined) updateData.color = String(data.color);

  await prisma.creditCard.update({ where: { id }, data: updateData });
  revalidatePath("/dashboard");
  revalidatePath(`/cards/${id}`);
  return { success: true };
}

export async function deleteCard(id: string) {
  const userId = await getUserId();
  const card = await prisma.creditCard.findFirst({ where: { id, userId } });
  if (!card) return { error: "Card not found" };

  await prisma.creditCard.delete({ where: { id } });
  revalidatePath("/dashboard");
  return { success: true };
}

// --- Monthly Overrides ---

export async function saveOverride(data: {
  creditCardId: string;
  monthNumber: number;
  payment?: number | null;
  purchases?: number | null;
}) {
  const userId = await getUserId();
  const parsed = overrideSchema.safeParse(data);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const card = await prisma.creditCard.findFirst({
    where: { id: parsed.data.creditCardId, userId },
  });
  if (!card) return { error: "Card not found" };

  await prisma.monthlyOverride.upsert({
    where: {
      creditCardId_monthNumber: {
        creditCardId: parsed.data.creditCardId,
        monthNumber: parsed.data.monthNumber,
      },
    },
    update: {
      payment: parsed.data.payment,
      purchases: parsed.data.purchases,
    },
    create: {
      creditCardId: parsed.data.creditCardId,
      monthNumber: parsed.data.monthNumber,
      payment: parsed.data.payment,
      purchases: parsed.data.purchases,
    },
  });

  revalidatePath(`/cards/${parsed.data.creditCardId}`);
  return { success: true };
}

export async function clearOverrides(creditCardId: string) {
  const userId = await getUserId();
  const card = await prisma.creditCard.findFirst({
    where: { id: creditCardId, userId },
  });
  if (!card) return { error: "Card not found" };

  await prisma.monthlyOverride.deleteMany({ where: { creditCardId } });
  revalidatePath(`/cards/${creditCardId}`);
  return { success: true };
}

// --- Monthly Statements ---

export async function saveStatement(data: Record<string, unknown>) {
  const userId = await getUserId();
  const parsed = statementSchema.safeParse(data);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const card = await prisma.creditCard.findFirst({
    where: { id: parsed.data.creditCardId, userId },
  });
  if (!card) return { error: "Card not found" };

  const statement = await prisma.monthlyStatement.upsert({
    where: {
      creditCardId_month_year: {
        creditCardId: parsed.data.creditCardId,
        month: parsed.data.month,
        year: parsed.data.year,
      },
    },
    update: parsed.data,
    create: parsed.data,
  });

  // Sync the card's balance only from its latest statement, so editing an
  // older month doesn't roll the current balance back
  if (await isLatestStatement(parsed.data.creditCardId, statement.id)) {
    await prisma.creditCard.update({
      where: { id: parsed.data.creditCardId },
      data: { currentBalance: parsed.data.endingBalance },
    });
  }

  revalidatePath("/dashboard");
  revalidatePath(`/cards/${parsed.data.creditCardId}`);
  return { success: true, statementId: statement.id };
}

export async function deleteStatement(id: string) {
  const userId = await getUserId();
  const statement = await getOwnedStatement(id, userId);
  if (!statement) return { error: "Statement not found" };

  // Transactions are removed via onDelete: Cascade; card balance is left as-is
  await prisma.monthlyStatement.delete({ where: { id } });

  revalidatePath("/dashboard");
  revalidatePath(`/cards/${statement.creditCardId}`);
  return { success: true };
}

/** Replaces a statement's totals and ending balance with its itemized sums. */
export async function syncStatementTotals(statementId: string) {
  const userId = await getUserId();
  const statement = await prisma.monthlyStatement.findFirst({
    where: { id: statementId, creditCard: { userId } },
    include: { transactions: { select: { amount: true, type: true } } },
  });
  if (!statement) return { error: "Statement not found" };
  if (statement.transactions.length === 0) {
    return { error: "Add transactions before syncing totals" };
  }

  const totals = summarizeTransactions(statement.transactions);
  const endingBalance = computeEndingBalance(statement.previousBalance, totals);

  await prisma.monthlyStatement.update({
    where: { id: statementId },
    data: { ...totals, endingBalance },
  });

  if (await isLatestStatement(statement.creditCardId, statementId)) {
    await prisma.creditCard.update({
      where: { id: statement.creditCardId },
      data: { currentBalance: endingBalance },
    });
  }

  revalidatePath("/dashboard");
  revalidatePath(`/cards/${statement.creditCardId}`);
  return { success: true };
}

async function getOwnedStatement(id: string, userId: string) {
  return prisma.monthlyStatement.findFirst({
    where: { id, creditCard: { userId } },
  });
}

async function isLatestStatement(creditCardId: string, statementId: string) {
  const latest = await prisma.monthlyStatement.findFirst({
    where: { creditCardId },
    orderBy: [{ year: "desc" }, { month: "desc" }],
    select: { id: true },
  });
  return latest?.id === statementId;
}

// --- Transactions ---

async function getOwnedTransaction(id: string, userId: string) {
  return prisma.transaction.findFirst({
    where: { id, statement: { creditCard: { userId } } },
    include: { statement: { select: { creditCardId: true } } },
  });
}

export async function createTransaction(data: Record<string, unknown>) {
  const userId = await getUserId();
  const parsed = transactionSchema.safeParse(data);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const statement = await getOwnedStatement(parsed.data.statementId, userId);
  if (!statement) return { error: "Statement not found" };

  const { amount, ...fields } = parsed.data;
  await prisma.transaction.create({
    data: { ...fields, amount: toSignedAmount(amount, fields.type) },
  });

  revalidatePath(`/cards/${statement.creditCardId}`);
  return { success: true };
}

export async function updateTransaction(id: string, data: Record<string, unknown>) {
  const userId = await getUserId();
  const parsed = transactionUpdateSchema.safeParse(data);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const transaction = await getOwnedTransaction(id, userId);
  if (!transaction) return { error: "Transaction not found" };

  const { amount, ...fields } = parsed.data;
  await prisma.transaction.update({
    where: { id },
    data: { ...fields, amount: toSignedAmount(amount, fields.type) },
  });

  revalidatePath(`/cards/${transaction.statement.creditCardId}`);
  return { success: true };
}

export async function deleteTransaction(id: string) {
  const userId = await getUserId();
  const transaction = await getOwnedTransaction(id, userId);
  if (!transaction) return { error: "Transaction not found" };

  await prisma.transaction.delete({ where: { id } });

  revalidatePath(`/cards/${transaction.statement.creditCardId}`);
  return { success: true };
}
