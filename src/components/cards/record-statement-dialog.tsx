"use client";

import { useState, useTransition } from "react";
import { X, Loader2, Save } from "lucide-react";
import { saveStatement } from "@/lib/actions";

interface CardInfo {
  id: string;
  name: string;
  currentBalance: number;
}

interface RecordStatementDialogProps {
  card: CardInfo;
  onClose: () => void;
}

export function RecordStatementDialog({ card, onClose }: RecordStatementDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [previousBalance, setPreviousBalance] = useState(card.currentBalance.toString());
  const [payments, setPayments] = useState("");
  const [purchases, setPurchases] = useState("");
  const [interestCharged, setInterestCharged] = useState("");
  const [fees, setFees] = useState("0");
  const [endingBalance, setEndingBalance] = useState("");
  const [minimumDue, setMinimumDue] = useState("");
  const [isPaid, setIsPaid] = useState(false);
  const [amountPaid, setAmountPaid] = useState("");
  const [notes, setNotes] = useState("");

  function handleSubmit() {
    setError("");
    startTransition(async () => {
      const result = await saveStatement({
        creditCardId: card.id,
        month,
        year,
        statementDate: new Date(year, month - 1, 9),
        dueDate: new Date(year, month, 2),
        previousBalance: Number(previousBalance),
        payments: Number(payments) || 0,
        purchases: Number(purchases) || 0,
        interestCharged: Number(interestCharged) || 0,
        fees: Number(fees) || 0,
        endingBalance: Number(endingBalance),
        minimumDue: Number(minimumDue) || 0,
        isPaid,
        amountPaid: Number(amountPaid) || 0,
        notes: notes || undefined,
      });

      if (result?.error) {
        setError(result.error);
      } else {
        onClose();
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-3xl shadow-xl max-w-lg w-full p-8 animate-slide-up max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-900">Record Statement</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm rounded-xl px-4 py-3 mb-4 font-medium">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Month</label>
              <select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {new Date(2026, i).toLocaleString("en", { month: "long" })}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Year</label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Previous Balance</label>
              <input type="number" step="0.01" value={previousBalance} onChange={(e) => setPreviousBalance(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Ending Balance</label>
              <input type="number" step="0.01" value={endingBalance} onChange={(e) => setEndingBalance(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none font-bold" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Payments Made</label>
              <input type="number" step="0.01" value={payments} onChange={(e) => setPayments(e.target.value)}
                className="w-full px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none text-emerald-900 font-semibold" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Purchases</label>
              <input type="number" step="0.01" value={purchases} onChange={(e) => setPurchases(e.target.value)}
                className="w-full px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-blue-900 font-semibold" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Interest Charged</label>
              <input type="number" step="0.01" value={interestCharged} onChange={(e) => setInterestCharged(e.target.value)}
                className="w-full px-4 py-3 bg-red-50 border border-red-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none text-red-900 font-semibold" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Fees</label>
              <input type="number" step="0.01" value={fees} onChange={(e) => setFees(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Minimum Due</label>
              <input type="number" step="0.01" value={minimumDue} onChange={(e) => setMinimumDue(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Amount Paid</label>
              <input type="number" step="0.01" value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)}
                className="w-full px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none text-emerald-900 font-semibold" />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isPaid"
              checked={isPaid}
              onChange={(e) => setIsPaid(e.target.checked)}
              className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            <label htmlFor="isPaid" className="text-sm font-medium text-slate-700">
              Mark as paid for this billing cycle
            </label>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
              placeholder="Any notes about this statement..."
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={isPending}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isPending ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            Save Statement
          </button>
        </div>
      </div>
    </div>
  );
}
