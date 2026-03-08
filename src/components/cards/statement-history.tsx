"use client";

import { formatCurrency } from "@/lib/utils";
import { FileText, CheckCircle2, AlertCircle } from "lucide-react";

interface Statement {
  id: string;
  month: number;
  year: number;
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
}

interface StatementHistoryProps {
  statements: Statement[];
  cardColor: string;
}

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export function StatementHistory({ statements, cardColor }: StatementHistoryProps) {
  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-6 border-b border-slate-100 bg-slate-50">
        <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
          <FileText size={20} className="text-slate-400" />
          Statement History
        </h3>
        <p className="text-sm text-slate-500 mt-1">
          Your actual monthly statements — the real record of your debt journey.
        </p>
      </div>

      <div className="overflow-x-auto">
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
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {statements.map((stmt) => (
              <tr key={stmt.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-3">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: cardColor }}
                    />
                    <span className="font-bold text-slate-900">
                      {MONTH_NAMES[stmt.month - 1]} {stmt.year}
                    </span>
                  </div>
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
