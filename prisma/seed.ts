import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`[seed] Missing required environment variable: ${name}`);
  }
  return value;
}

async function main() {
  console.log("Seeding database...");

  const seedUserEmail = requireEnv("SEED_USER_EMAIL");
  const seedUserPassword = requireEnv("SEED_USER_PASSWORD");
  const seedUserName = process.env.SEED_USER_NAME?.trim() || "Seed User";

  // Create default user
  const hashedPassword = await bcrypt.hash(seedUserPassword, 12);
  const user = await prisma.user.upsert({
    where: { email: seedUserEmail },
    update: { name: seedUserName, password: hashedPassword },
    create: {
      name: seedUserName,
      email: seedUserEmail,
      password: hashedPassword,
    },
  });

  console.log(`User created: ${user.email}`);

  // BPI Amore Cashback Card
  const bpiCard = await prisma.creditCard.upsert({
    where: { id: "bpi-amore-cashback" },
    update: {},
    create: {
      id: "bpi-amore-cashback",
      userId: user.id,
      name: "BPI Amore Cashback",
      bankName: "BPI",
      creditLimit: 94000,
      currentBalance: 71650.7,
      interestRate: 0.03,
      computation: "BPI",
      minPayment: 2558.95,
      targetPayment: 5000,
      color: "#ef4444",
      statementDay: 8,
      dueDateDay: 2,
    },
  });

  // BPI February 2026 Statement
  await prisma.monthlyStatement.upsert({
    where: {
      creditCardId_month_year: {
        creditCardId: bpiCard.id,
        month: 2,
        year: 2026,
      },
    },
    update: {},
    create: {
      creditCardId: bpiCard.id,
      month: 2,
      year: 2026,
      statementDate: new Date("2026-02-08"),
      dueDate: new Date("2026-03-02"),
      previousBalance: 71949.15,
      payments: 2570.0,
      purchases: 0,
      interestCharged: 2271.55,
      fees: 0,
      endingBalance: 71650.7,
      minimumDue: 2558.95,
      isPaid: false,
      amountPaid: 0,
      notes: "Feb 2026 statement - Finance charge ₱2,271.55",
    },
  });

  // BPI Transactions
  const bpiStatement = await prisma.monthlyStatement.findFirst({
    where: { creditCardId: bpiCard.id, month: 2, year: 2026 },
  });

  if (bpiStatement) {
    await prisma.transaction.createMany({
      skipDuplicates: true,
      data: [
        {
          statementId: bpiStatement.id,
          date: new Date("2026-01-28"),
          postDate: new Date("2026-01-29"),
          description: "Payment - Thank You",
          amount: -2570.0,
          type: "payment",
        },
        {
          statementId: bpiStatement.id,
          date: new Date("2026-01-28"),
          postDate: new Date("2026-01-29"),
          description: "Finance Charge",
          amount: 2271.55,
          type: "interest",
        },
      ],
    });
  }

  console.log("BPI Amore Cashback seeded");

  // Security Bank Platinum Card
  const secCard = await prisma.creditCard.upsert({
    where: { id: "security-bank-platinum" },
    update: {},
    create: {
      id: "security-bank-platinum",
      userId: user.id,
      name: "Security Bank Platinum",
      bankName: "Security Bank",
      creditLimit: 136000,
      currentBalance: 133820.73,
      interestRate: 0.03,
      computation: "STANDARD",
      minPayment: 4014.62,
      targetPayment: 10000,
      color: "#3b82f6",
      statementDay: 9,
      dueDateDay: 2,
    },
  });

  // Security Bank February 2026 Statement
  await prisma.monthlyStatement.upsert({
    where: {
      creditCardId_month_year: {
        creditCardId: secCard.id,
        month: 2,
        year: 2026,
      },
    },
    update: {},
    create: {
      creditCardId: secCard.id,
      month: 2,
      year: 2026,
      statementDate: new Date("2026-02-09"),
      dueDate: new Date("2026-03-02"),
      previousBalance: 125917.04,
      payments: 3780.0,
      purchases: 7825.75, // Excluding the payment credit
      interestCharged: 3857.94,
      fees: 0,
      endingBalance: 133820.73,
      minimumDue: 4014.62,
      isPaid: false,
      amountPaid: 0,
      notes: "Feb 2026 statement - Interest ₱3,857.94. Purchases: Apple.com, The Loop, Uniqlo, Grab, Name-Cheap, Mercury Drug",
    },
  });

  // Security Bank Transactions
  const secStatement = await prisma.monthlyStatement.findFirst({
    where: { creditCardId: secCard.id, month: 2, year: 2026 },
  });

  if (secStatement) {
    await prisma.transaction.createMany({
      skipDuplicates: true,
      data: [
        {
          statementId: secStatement.id,
          date: new Date("2026-02-09"),
          postDate: new Date("2026-02-09"),
          description: "INTEREST CHARGES",
          amount: 3857.94,
          type: "interest",
        },
        {
          statementId: secStatement.id,
          date: new Date("2026-01-19"),
          postDate: new Date("2026-01-21"),
          description: "APPLE.COM/BILL, CORK",
          amount: 1319.5,
          type: "purchase",
        },
        {
          statementId: secStatement.id,
          date: new Date("2026-01-27"),
          postDate: new Date("2026-01-28"),
          description: "PAYMENT - PHP/SBC1",
          amount: -3780.0,
          type: "payment",
        },
        {
          statementId: secStatement.id,
          date: new Date("2026-01-28"),
          postDate: new Date("2026-01-28"),
          description: "THE LOOP AYALA FELIZ 3/3",
          amount: 3333.34,
          type: "purchase",
        },
        {
          statementId: secStatement.id,
          date: new Date("2026-01-28"),
          postDate: new Date("2026-01-30"),
          description: "UNIQLO-PODIUM, MANDALUYONG",
          amount: 792.0,
          type: "purchase",
        },
        {
          statementId: secStatement.id,
          date: new Date("2026-01-29"),
          postDate: new Date("2026-01-31"),
          description: "GRAB, MAKATI",
          amount: 232.0,
          type: "purchase",
        },
        {
          statementId: secStatement.id,
          date: new Date("2026-01-30"),
          postDate: new Date("2026-02-01"),
          description: "GRAB, MAKATI",
          amount: 230.0,
          type: "purchase",
        },
        {
          statementId: secStatement.id,
          date: new Date("2026-01-31"),
          postDate: new Date("2026-02-01"),
          description: "NAME-CHEAP.COM* JINS2X, PHOENIX",
          amount: 898.91,
          type: "purchase",
        },
        {
          statementId: secStatement.id,
          date: new Date("2026-02-01"),
          postDate: new Date("2026-02-03"),
          description: "GRAB, MAKATI",
          amount: 123.0,
          type: "purchase",
        },
        {
          statementId: secStatement.id,
          date: new Date("2026-02-03"),
          postDate: new Date("2026-02-05"),
          description: "GRAB, MAKATI",
          amount: 237.0,
          type: "purchase",
        },
        {
          statementId: secStatement.id,
          date: new Date("2026-02-07"),
          postDate: new Date("2026-02-09"),
          description: "MERCURYDRUGCORP1152, PASIG",
          amount: 660.0,
          type: "purchase",
        },
      ],
    });
  }

  console.log("Security Bank Platinum seeded");
  console.log("\nSeed complete!");
  console.log(`Seed user email: ${seedUserEmail}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
