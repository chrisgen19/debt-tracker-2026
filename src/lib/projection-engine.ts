export interface CardInput {
  balance: number;
  interestRate: number; // Monthly rate as decimal (0.03 = 3%)
  computation: string; // "BPI" or "STANDARD"
  targetPayment: number;
}

export interface MonthOverride {
  payment?: number | null;
  purchases?: number | null;
}

export interface ProjectionMonth {
  month: number;
  startBalance: number;
  newPurchases: number;
  payment: number;
  interest: number;
  endBalance: number;
  isCustomized: boolean;
}

export interface ProjectionResult {
  data: ProjectionMonth[];
  willPayOff: boolean;
  totalInterest: number;
  months: number;
  totalPaid: number;
}

/**
 * Core debt projection engine.
 *
 * BPI computation: daily rate = (monthly_rate × 12) / 360
 * Standard (Security Bank) computation: daily rate = monthly_rate / 30
 *
 * Interest is calculated in two phases:
 * 1. Before payment (21 days): full balance × daily rate × 21
 * 2. After payment (9 days): remaining balance × daily rate × 9
 */
export function generateProjection(
  card: CardInput,
  overrides: Record<number, MonthOverride>
): ProjectionResult {
  let currentBalance = card.balance;
  const basePayment = card.targetPayment;

  if (
    isNaN(currentBalance) ||
    isNaN(basePayment) ||
    currentBalance <= 0 ||
    basePayment <= 0
  ) {
    return { data: [], willPayOff: false, totalInterest: 0, months: 0, totalPaid: 0 };
  }

  let monthsCount = 0;
  let totalInterestPaid = 0;
  let totalPrincipalPaid = 0;
  const data: ProjectionMonth[] = [];

  const dailyRate =
    card.computation === "BPI"
      ? (card.interestRate * 12) / 360
      : card.interestRate / 30;

  const daysBeforePayment = 21;
  const daysAfterPayment = 9;
  const MAX_MONTHS = 360;

  while (currentBalance > 0 && monthsCount < MAX_MONTHS) {
    monthsCount++;
    const startBalance = currentBalance;

    const monthOverride = overrides[monthsCount] || {};
    const targetPayment =
      monthOverride.payment != null ? monthOverride.payment : basePayment;
    const newPurchases =
      monthOverride.purchases != null ? monthOverride.purchases : 0;

    let interestThisMonth = 0;
    let actualPayment = targetPayment;

    if (
      currentBalance + currentBalance * dailyRate * daysBeforePayment <=
      targetPayment
    ) {
      // Final payment — can pay off entire balance + interest
      interestThisMonth = currentBalance * dailyRate * daysBeforePayment;
      actualPayment = currentBalance + interestThisMonth;
      currentBalance = newPurchases;
    } else {
      const interestBeforePayment =
        currentBalance * dailyRate * daysBeforePayment;
      const remainingBalanceAfterPayment = currentBalance - targetPayment;
      const interestAfterPayment =
        Math.max(0, remainingBalanceAfterPayment) * dailyRate * daysAfterPayment;

      interestThisMonth = interestBeforePayment + interestAfterPayment;
      currentBalance =
        remainingBalanceAfterPayment + interestThisMonth + newPurchases;
    }

    totalInterestPaid += interestThisMonth;
    totalPrincipalPaid += actualPayment - interestThisMonth;

    data.push({
      month: monthsCount,
      startBalance,
      newPurchases,
      payment: actualPayment,
      interest: interestThisMonth,
      endBalance: currentBalance,
      isCustomized: !!overrides[monthsCount],
    });

    if (currentBalance <= 0 && newPurchases <= 0) break;
  }

  return {
    data,
    willPayOff: currentBalance <= 0,
    totalInterest: totalInterestPaid,
    months: monthsCount,
    totalPaid: totalPrincipalPaid + totalInterestPaid,
  };
}
