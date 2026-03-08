"use client";

import { useMemo, useState, useTransition, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AreaChart, Area, ResponsiveContainer,
} from "recharts";
import {
  ArrowLeft, Settings, RotateCcw, CheckCircle2, Save, Loader2,
  FileText, Trash2,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import {
  generateProjection,
  type MonthOverride,
  type ProjectionResult,
} from "@/lib/projection-engine";
import { updateCard, saveOverride, clearOverrides, deleteCard } from "@/lib/actions";
import { StatementHistory } from "@/components/cards/statement-history";
import { RecordStatementDialog } from "@/components/cards/record-statement-dialog";

interface Override {
  monthNumber: number;
  payment: number | null;
  purchases: number | null;
}

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
  statementDate: Date;
  dueDate: Date;
  notes: string | null;
}

interface CardData {
  id: string;
  name: string;
  bankName: string;
  creditLimit: number;
  currentBalance: number;
  interestRate: number;
  computation: string;
  minPayment: number;
  targetPayment: number;
  color: string;
  overrides: Override[];
  statements: Statement[];
}

interface CardDetailViewProps {
  card: CardData;
}

export function CardDetailView({ card }: CardDetailViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [targetPayment, setTargetPayment] = useState(card.targetPayment.toString());
  const [currentBalance, setCurrentBalance] = useState(card.currentBalance.toString());
  const [showStatement, setShowStatement] = useState(false);

  // Build overrides map from DB data
  const overridesMap = useMemo(() => {
    const map: Record<number, MonthOverride> = {};
    for (const o of card.overrides) {
      map[o.monthNumber] = { payment: o.payment, purchases: o.purchases };
    }
    return map;
  }, [card.overrides]);

  // Local override state for inputs (optimistic)
  const [localOverrides, setLocalOverrides] = useState<
    Record<number, { payment?: string; purchases?: string }>
  >(() => {
    const initial: Record<number, { payment?: string; purchases?: string }> = {};
    for (const o of card.overrides) {
      initial[o.monthNumber] = {
        payment: o.payment?.toString() ?? "",
        purchases: o.purchases?.toString() ?? "",
      };
    }
    return initial;
  });

  const projection: ProjectionResult = useMemo(() => {
    // Merge DB overrides with local edits for real-time projection
    const merged: Record<number, MonthOverride> = { ...overridesMap };
    for (const [monthStr, vals] of Object.entries(localOverrides)) {
      const month = Number(monthStr);
      merged[month] = {
        payment:
          vals.payment !== undefined && vals.payment !== ""
            ? Number(vals.payment)
            : overridesMap[month]?.payment ?? null,
        purchases:
          vals.purchases !== undefined && vals.purchases !== ""
            ? Number(vals.purchases)
            : overridesMap[month]?.purchases ?? null,
      };
    }

    return generateProjection(
      {
        balance: Number(currentBalance) || card.currentBalance,
        interestRate: card.interestRate,
        computation: card.computation,
        targetPayment: Number(targetPayment) || card.targetPayment,
      },
      merged
    );
  }, [card, currentBalance, targetPayment, overridesMap, localOverrides]);

  const handleSaveSettings = useCallback(() => {
    startTransition(async () => {
      await updateCard(card.id, {
        targetPayment: Number(targetPayment),
        currentBalance: Number(currentBalance),
      });
      router.refresh();
    });
  }, [card.id, targetPayment, currentBalance, router]);

  const handleOverrideBlur = useCallback(
    (monthNumber: number) => {
      const local = localOverrides[monthNumber];
      if (!local) return;

      startTransition(async () => {
        await saveOverride({
          creditCardId: card.id,
          monthNumber,
          payment: local.payment !== undefined && local.payment !== "" ? Number(local.payment) : null,
          purchases:
            local.purchases !== undefined && local.purchases !== ""
              ? Number(local.purchases)
              : null,
        });
      });
    },
    [card.id, localOverrides]
  );

  const handleResetOverrides = useCallback(() => {
    if (!confirm("Clear all customized monthly purchases and payments?")) return;
    startTransition(async () => {
      await clearOverrides(card.id);
      setLocalOverrides({});
      router.refresh();
    });
  }, [card.id, router]);

  const handleDeleteCard = useCallback(() => {
    if (!confirm(`Delete "${card.name}"? This action cannot be undone.`)) return;
    startTransition(async () => {
      await deleteCard(card.id);
      router.push("/dashboard");
      router.refresh();
    });
  }, [card.id, card.name, router]);

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Navigation & Header */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors font-medium px-2 py-1"
        >
          <ArrowLeft size={18} />
          Back to Dashboard
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: card.color }} />
          <span className="font-bold text-slate-800">{card.name}</span>
          <button
            onClick={handleDeleteCard}
            className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-xl transition-colors"
            title="Delete card"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card Settings Panel */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col gap-5">
          <h2 className="text-lg font-bold flex items-center gap-2 text-slate-800">
            <Settings size={20} className="text-slate-400" />
            Account Settings
          </h2>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Current Balance
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">
                ₱
              </span>
              <input
                type="number"
                value={currentBalance}
                onChange={(e) => setCurrentBalance(e.target.value)}
                className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Target Monthly Payment
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">
                ₱
              </span>
              <input
                type="number"
                value={targetPayment}
                onChange={(e) => setTargetPayment(e.target.value)}
                className="w-full pl-8 pr-4 py-3 bg-emerald-50/50 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all font-medium text-emerald-900"
              />
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Minimum required:{" "}
              <span className="font-semibold">{formatCurrency(card.minPayment)}</span>
            </p>
          </div>

          <button
            onClick={handleSaveSettings}
            disabled={isPending}
            className="flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all disabled:opacity-50"
          >
            {isPending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            Save Settings
          </button>

          <div className="mt-auto pt-4 border-t border-slate-100 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-500">Interest Rate</span>
              <span className="text-sm font-bold text-slate-700">
                {card.interestRate * 100}%/mo
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-500">Bank Engine</span>
              <span className="text-xs font-bold px-2 py-1 bg-slate-100 text-slate-600 rounded-lg">
                {card.computation}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-500">Credit Limit</span>
              <span className="text-sm font-bold text-slate-700">
                {formatCurrency(card.creditLimit)}
              </span>
            </div>
          </div>
        </div>

        {/* Stats + Mini Chart */}
        <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-center col-span-2 sm:col-span-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
              Time to Zero
            </span>
            <div className="text-3xl font-bold text-slate-900 mb-1">
              {projection.months}
            </div>
            <span className="text-sm text-slate-500">Months</span>
          </div>

          <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-center col-span-2 sm:col-span-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
              Interest Paid
            </span>
            <div className="text-xl font-bold text-red-500 mb-1">
              {formatCurrency(projection.totalInterest)}
            </div>
            <span className="text-sm text-slate-500">Total</span>
          </div>

          <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 col-span-2 hidden sm:flex flex-col justify-center relative overflow-hidden">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 relative z-10">
              Balance Trend
            </span>
            <div className="absolute inset-0 pt-10">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={projection.data}>
                  <Area
                    type="monotone"
                    dataKey="endBalance"
                    stroke={card.color}
                    fill={card.color}
                    fillOpacity={0.1}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Record Statement Button */}
          <div className="col-span-2 sm:col-span-4">
            <button
              onClick={() => setShowStatement(true)}
              className="w-full flex items-center justify-center gap-2 py-3 bg-white border-2 border-dashed border-slate-200 hover:border-indigo-400 text-slate-600 hover:text-indigo-600 font-bold rounded-2xl transition-all"
            >
              <FileText size={18} />
              Record Monthly Statement
            </button>
          </div>
        </div>
      </div>

      {/* Statement History */}
      {card.statements.length > 0 && (
        <StatementHistory statements={card.statements} cardColor={card.color} />
      )}

      {/* Interactive Ledger */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
        <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-slate-800 text-lg">Interactive Ledger</h3>
            <p className="text-sm text-slate-500 mt-1">
              Plan future purchases or adjust monthly payments. Changes auto-save on blur.
            </p>
          </div>
          <button
            onClick={handleResetOverrides}
            className="p-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-xl transition-colors"
            title="Reset all custom edits"
          >
            <RotateCcw size={18} />
          </button>
        </div>

        <div className="overflow-x-auto" style={{ maxHeight: "550px" }}>
          <table className="w-full text-sm text-left relative">
            <thead className="text-xs text-slate-500 uppercase bg-white sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-6 py-4 font-bold">Mo</th>
                <th className="px-4 py-4 font-bold">Start Balance</th>
                <th className="px-4 py-4 font-bold text-blue-600 w-36">
                  + New Charges
                </th>
                <th className="px-4 py-4 font-bold text-emerald-600 w-36">
                  - Payment
                </th>
                <th className="px-4 py-4 font-bold text-red-500">Interest</th>
                <th className="px-6 py-4 font-bold text-right">End Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {projection.data.map((row) => {
                const local = localOverrides[row.month];
                return (
                  <tr
                    key={row.month}
                    className={`transition-colors ${
                      row.isCustomized ? "bg-indigo-50/30" : "hover:bg-slate-50"
                    }`}
                  >
                    <td className="px-6 py-3 font-bold text-slate-900">
                      {row.month}
                    </td>
                    <td className="px-4 py-3 text-slate-500 font-medium">
                      {formatCurrency(row.startBalance)}
                    </td>
                    <td className="px-4 py-2">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
                          ₱
                        </span>
                        <input
                          type="number"
                          min="0"
                          placeholder="0"
                          className="w-full pl-7 pr-2 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white transition-all shadow-sm"
                          value={local?.purchases ?? ""}
                          onChange={(e) =>
                            setLocalOverrides((prev) => ({
                              ...prev,
                              [row.month]: {
                                ...prev[row.month],
                                purchases: e.target.value,
                              },
                            }))
                          }
                          onBlur={() => handleOverrideBlur(row.month)}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500 text-xs font-bold">
                          ₱
                        </span>
                        <input
                          type="number"
                          min="0"
                          placeholder={card.targetPayment.toString()}
                          className="w-full pl-7 pr-2 py-2 text-sm border border-emerald-200 bg-emerald-50/50 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all shadow-sm font-semibold text-emerald-900"
                          value={local?.payment ?? ""}
                          onChange={(e) =>
                            setLocalOverrides((prev) => ({
                              ...prev,
                              [row.month]: {
                                ...prev[row.month],
                                payment: e.target.value,
                              },
                            }))
                          }
                          onBlur={() => handleOverrideBlur(row.month)}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-red-500 font-medium">
                      +{formatCurrency(row.interest)}
                    </td>
                    <td className="px-6 py-3 text-right font-bold text-slate-900">
                      {formatCurrency(Math.max(0, row.endBalance))}
                    </td>
                  </tr>
                );
              })}
              {projection.willPayOff && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center bg-emerald-50">
                    <div className="flex flex-col items-center gap-2 text-emerald-700">
                      <CheckCircle2 size={32} />
                      <span className="font-bold text-lg">Debt Paid Off!</span>
                      <span className="text-sm">
                        No more payments required for this card.
                      </span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showStatement && (
        <RecordStatementDialog
          card={card}
          onClose={() => {
            setShowStatement(false);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
