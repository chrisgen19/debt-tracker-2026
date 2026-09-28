"use client";

import { Fragment, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  FileText, CheckCircle2, AlertCircle, ChevronRight, Pencil, Trash2,
} from "lucide-react";
import { deleteStatement } from "@/lib/actions";
import { cn, formatCurrency } from "@/lib/utils";
import { StatementTransactions } from "@/components/cards/statement-transactions";
import { RecordStatementDialog } from "@/components/cards/record-statement-dialog";
import type { StatementWithTransactions } from "@/types/statement";

interface StatementHistoryProps {
  statements: StatementWithTransactions[];
  card: { id: string; name: string; currentBalance: number; color: string };
}

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const COLUMN_COUNT = 8;

export function StatementHistory({ statements, card }: StatementHistoryProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editing, setEditing] = useState<StatementWithTransactions | null>(null);

  function handleDelete(statement: StatementWithTransactions) {
    const period = `${MONTH_NAMES[statement.month - 1]} ${statement.year}`;
    const count = statement.transactions.length;
    const message = `Delete the ${period} statement and its ${count} transaction(s)? Your card's current balance won't change.`;
    if (!confirm(message)) return;

    setError("");
    startTransition(async () => {
      const result = await deleteStatement(statement.id);
      if (result.error) setError(result.error);
      else router.refresh();
    });
  }

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-6 border-b border-slate-100 bg-slate-50">
        <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
          <FileText size={20} className="text-slate-400" />
          Statement History
        </h3>
        <p className="text-sm text-slate-500 mt-1">
          Your actual monthly statements — the real record of your debt journey. Tap a period to
          manage its transactions.
        </p>
        {error && (
          <div className="bg-red-50 text-red-600 text-sm rounded-xl px-4 py-3 mt-4 font-medium">
            {error}
          </div>
        )}
      </div>

      {/* @container lets the expanded panel size itself to the visible scroll area */}
      <div className="overflow-x-auto @container">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-500 uppercase bg-white border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 font-bold">Period</th>
              <th className="px-4 py-4 font-bold">Previous</th>
              <th className="px-4 py-4 font-bold text-emerald-600">Payments</th>
              <th className="px-4 py-4 font-bold text-blue-600">Purchases</th>
              <th className="px-4 py-4 font-bold text-red-500">Interest</th>
              <th className="px-4 py-4 font-bold">Ending</th>
              <th className="px-4 py-4 font-bold text-center">Status</th>
              <th className="px-4 py-4">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {statements.map((stmt) => {
              const isExpanded = expandedId === stmt.id;
              return (
                <Fragment key={stmt.id}>
                  <StatementRow
                    statement={stmt}
                    cardColor={card.color}
                    isExpanded={isExpanded}
                    disabled={isPending}
                    onToggle={() => setExpandedId(isExpanded ? null : stmt.id)}
                    onEdit={() => setEditing(stmt)}
                    onDelete={() => handleDelete(stmt)}
                  />
                  {isExpanded && (
                    <tr>
                      <td colSpan={COLUMN_COUNT} className="p-0 bg-slate-50/70">
                        <div className="sticky left-0 w-[100cqw] px-4 py-5 sm:px-6">
                          <StatementTransactions statement={stmt} />
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {editing && (
        <RecordStatementDialog
          card={card}
          statement={editing}
          onClose={() => {
            setEditing(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

interface StatementRowProps {
  statement: StatementWithTransactions;
  cardColor: string;
  isExpanded: boolean;
  disabled: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function StatementRow({
  statement: stmt, cardColor, isExpanded, disabled, onToggle, onEdit, onDelete,
}: StatementRowProps) {
  return (
    <tr className={cn("transition-colors", isExpanded ? "bg-slate-50" : "hover:bg-slate-50")}>
      <td className="px-6 py-3">
        <button
          onClick={onToggle}
          aria-expanded={isExpanded}
          className="flex items-center gap-2 text-left whitespace-nowrap"
        >
          <ChevronRight
            size={16}
            className={cn("text-slate-400 transition-transform", isExpanded && "rotate-90")}
          />
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cardColor }} />
          <span className="font-bold text-slate-900">
            {MONTH_NAMES[stmt.month - 1]} {stmt.year}
          </span>
          <span className="text-xs font-medium text-slate-400">
            {stmt.transactions.length} items
          </span>
        </button>
      </td>
      <td className="px-4 py-3 text-slate-500 font-medium">
        {formatCurrency(stmt.previousBalance)}
      </td>
      <td className="px-4 py-3 text-emerald-600 font-semibold">
        -{formatCurrency(stmt.payments)}
      </td>
      <td className="px-4 py-3 text-blue-600 font-medium">
        +{formatCurrency(stmt.purchases)}
      </td>
      <td className="px-4 py-3 text-red-500 font-medium">
        +{formatCurrency(stmt.interestCharged)}
      </td>
      <td className="px-4 py-3 font-bold text-slate-900">
        {formatCurrency(stmt.endingBalance)}
      </td>
      <td className="px-4 py-3 text-center">
        {stmt.isPaid ? (
          <span className="inline-flex items-center gap-1 text-emerald-600 text-xs font-bold">
            <CheckCircle2 size={14} />
            Paid
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-amber-600 text-xs font-bold">
            <AlertCircle size={14} />
            Pending
          </span>
        )}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={onEdit}
            disabled={disabled}
            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-50"
            title="Edit statement"
          >
            <Pencil size={16} />
          </button>
          <button
            onClick={onDelete}
            disabled={disabled}
            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
            title="Delete statement"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </td>
    </tr>
  );
}
