import type { StatementWithTransactions, TransactionItem } from "@/types/statement";

export interface StatementTotals {
  payments: number;
  purchases: number;
  interestCharged: number;
  fees: number;
}

export interface TotalsMismatch {
  key: keyof StatementTotals | "endingBalance";
  label: string;
  recorded: number;
  itemized: number;
}

const TOTAL_LABELS: Record<TotalsMismatch["key"], string> = {
  payments: "Payments",
  purchases: "Purchases",
  interestCharged: "Interest",
  fees: "Fees",
  endingBalance: "Ending balance",
};

const roundCents = (value: number) => Math.round(value * 100) / 100;

/** Stores payments as negative and every other type as positive. */
export const toSignedAmount = (amount: number, type: string) =>
  type === "payment" ? -Math.abs(amount) : Math.abs(amount);

/**
 * Sums transactions into statement totals. Payments are returned as a
 * positive number, matching how MonthlyStatement.payments is stored.
 */
export const summarizeTransactions = (
  transactions: Pick<TransactionItem, "amount" | "type">[]
): StatementTotals => {
  const totals: StatementTotals = { payments: 0, purchases: 0, interestCharged: 0, fees: 0 };

  for (const { amount, type } of transactions) {
    if (type === "payment") totals.payments -= amount;
    else if (type === "purchase") totals.purchases += amount;
    else if (type === "interest") totals.interestCharged += amount;
    else if (type === "fee") totals.fees += amount;
  }

  return {
    payments: roundCents(totals.payments),
    purchases: roundCents(totals.purchases),
    interestCharged: roundCents(totals.interestCharged),
    fees: roundCents(totals.fees),
  };
};

export const computeEndingBalance = (previousBalance: number, totals: StatementTotals) =>
  roundCents(
    previousBalance + totals.purchases + totals.interestCharged + totals.fees - totals.payments
  );

/** Lists the statement fields whose recorded value differs from the itemized sum. */
export const getTotalsMismatch = (
  statement: Pick<StatementWithTransactions, "previousBalance" | "endingBalance"> & StatementTotals,
  itemized: StatementTotals
): TotalsMismatch[] => {
  const itemizedValues = {
    ...itemized,
    endingBalance: computeEndingBalance(statement.previousBalance, itemized),
  };

  return (Object.keys(TOTAL_LABELS) as TotalsMismatch["key"][])
    .filter((key) => roundCents(statement[key]) !== itemizedValues[key])
    .map((key) => ({
      key,
      label: TOTAL_LABELS[key],
      recorded: statement[key],
      itemized: itemizedValues[key],
    }));
};
