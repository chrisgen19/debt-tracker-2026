export interface TransactionItem {
  id: string;
  date: Date;
  postDate: Date;
  description: string;
  amount: number; // Signed: payments are negative, charges positive
  type: string;
}

export interface StatementWithTransactions {
  id: string;
  month: number;
  year: number;
  statementDate: Date;
  dueDate: Date;
  previousBalance: number;
  payments: number;
  purchases: number;
  interestCharged: number;
  fees: number;
  endingBalance: number;
  minimumDue: number;
  isPaid: boolean;
  amountPaid: number;
  notes: string | null;
  transactions: TransactionItem[];
}
