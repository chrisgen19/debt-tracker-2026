"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { creditCardSchema, overrideSchema, statementSchema } from "@/schemas/card";
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

  // Also update the card's current balance to match ending balance
  await prisma.creditCard.update({
    where: { id: parsed.data.creditCardId },
    data: { currentBalance: parsed.data.endingBalance },
  });

  revalidatePath("/dashboard");
  revalidatePath(`/cards/${parsed.data.creditCardId}`);
  return { success: true, statementId: statement.id };
}
