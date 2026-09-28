"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, RefreshCw, AlertTriangle, Loader2 } from "lucide-react";
import { deleteTransaction, syncStatementTotals } from "@/lib/actions";
import { cn, formatCurrency, formatShortDate } from "@/lib/utils";
import {
  getTotalsMismatch,
  summarizeTransactions,
  type TotalsMismatch,
} from "@/lib/statement-totals";
import { TransactionFormDialog } from "@/components/cards/transaction-form-dialog";
import type { StatementWithTransactions, TransactionItem } from "@/types/statement";

interface StatementTransactionsProps {
  statement: StatementWithTransactions;
}

type FormState = { transaction?: TransactionItem } | null;

const TYPE_STYLES: Record<string, { badge: string; amount: string }> = {
  purchase: { badge: "bg-blue-50 text-blue-700", amount: "text-blue-600" },
  payment: { badge: "bg-emerald-50 text-emerald-700", amount: "text-emerald-600" },
  interest: { badge: "bg-red-50 text-red-600", amount: "text-red-500" },
  fee: { badge: "bg-amber-50 text-amber-700", amount: "text-amber-600" },
};

export function StatementTransactions({ statement }: StatementTransactionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [form, setForm] = useState<FormState>(null);
  const { transactions } = statement;

  const mismatches = useMemo(
    () =>
      transactions.length > 0
        ? getTotalsMismatch(statement, summarizeTransactions(transactions))
        : [],
    [statement, transactions]
  );

  function runAction(action: () => Promise<{ error?: string }>) {
    setError("");
    startTransition(async () => {
      const result = await action();
      if (result.error) setError(result.error);
      else router.refresh();
    });
  }

  function handleDelete(transaction: TransactionItem) {
    if (!confirm(`Delete "${transaction.description}"?`)) return;
    runAction(() => deleteTransaction(transaction.id));
  }

  function handleSync() {
    if (!confirm("Replace this statement's totals and ending balance with the itemized sums?")) return;
    runAction(() => syncStatementTotals(statement.id));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h4 className="text-sm font-bold text-slate-700">
          Transactions <span className="text-slate-400 font-medium">({transactions.length})</span>
        </h4>
        <button
          onClick={() => setForm({})}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors"
        >
          <Plus size={14} />
          Add
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm rounded-xl px-4 py-3 font-medium">{error}</div>
      )}

      {mismatches.length > 0 && (
        <TotalsMismatchBanner mismatches={mismatches} isPending={isPending} onSync={handleSync} />
      )}

      {transactions.length === 0 ? (
        <p className="text-sm text-slate-500 bg-white rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-center">
          No transactions yet — add the items from your statement.
        </p>
      ) : (
        <ul className="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-100">
          {transactions.map((transaction) => (
            <TransactionRow
              key={transaction.id}
              transaction={transaction}
              disabled={isPending}
              onEdit={() => setForm({ transaction })}
              onDelete={() => handleDelete(transaction)}
            />
          ))}
        </ul>
      )}

      {form && (
        <TransactionFormDialog
          statementId={statement.id}
          transaction={form.transaction}
          onClose={() => setForm(null)}
        />
      )}
    </div>
  );
}

interface TransactionRowProps {
  transaction: TransactionItem;
  disabled: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

function TransactionRow({ transaction, disabled, onEdit, onDelete }: TransactionRowProps) {
  const styles = TYPE_STYLES[transaction.type] ?? TYPE_STYLES.purchase;
  const sign = transaction.amount < 0 ? "-" : "+";

  return (
    <li className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:gap-4">
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-slate-900 truncate">{transaction.description}</p>
        <p className="text-xs text-slate-500">
          {formatShortDate(transaction.date)} · Posted {formatShortDate(transaction.postDate)}
        </p>
      </div>
      <div className="flex items-center justify-between gap-3 sm:justify-end">
        <span className={cn("px-2 py-0.5 rounded-full text-xs font-bold capitalize", styles.badge)}>
          {transaction.type}
        </span>
        <span className={cn("font-semibold tabular-nums sm:w-28 sm:text-right", styles.amount)}>
          {sign}
          {formatCurrency(Math.abs(transaction.amount))}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={onEdit}
            disabled={disabled}
            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-50"
            title="Edit transaction"
          >
            <Pencil size={16} />
          </button>
          <button
            onClick={onDelete}
            disabled={disabled}
            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
            title="Delete transaction"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </li>
  );
}

interface TotalsMismatchBannerProps {
  mismatches: TotalsMismatch[];
  isPending: boolean;
  onSync: () => void;
}

function TotalsMismatchBanner({ mismatches, isPending, onSync }: TotalsMismatchBannerProps) {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 space-y-3">
      <div className="flex items-start gap-2 text-amber-800">
        <AlertTriangle size={18} className="mt-0.5 shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-bold">Itemized transactions don&apos;t match this statement</p>
          <ul className="mt-1 space-y-0.5 text-xs">
            {mismatches.map((m) => (
              <li key={m.key}>
                <span className="font-semibold">{m.label}:</span> recorded {formatCurrency(m.recorded)} ·
                itemized {formatCurrency(m.itemized)}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <button
        onClick={onSync}
        disabled={isPending}
        className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-amber-300 hover:bg-amber-100 text-amber-800 text-xs font-bold rounded-xl transition-colors disabled:opacity-50"
      >
        {isPending ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
        Sync totals from transactions
      </button>
    </div>
  );
}
