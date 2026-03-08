"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  Wallet, TrendingDown, Calendar, ChevronRight, PlusCircle, CreditCard,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { generateProjection, type MonthOverride } from "@/lib/projection-engine";
import { AddCardDialog } from "@/components/dashboard/add-card-dialog";

interface CardWithRelations {
  id: string;
  name: string;
  bankName: string;
  currentBalance: number;
  interestRate: number;
  computation: string;
  targetPayment: number;
  minPayment: number;
  creditLimit: number;
  color: string;
  overrides: { monthNumber: number; payment: number | null; purchases: number | null }[];
  statements: { month: number; year: number; endingBalance: number; amountPaid: number }[];
}

interface DashboardViewProps {
  cards: CardWithRelations[];
}

export function DashboardView({ cards }: DashboardViewProps) {
  const [showAddCard, setShowAddCard] = useState(false);

  const projections = useMemo(() => {
    const results: Record<string, ReturnType<typeof generateProjection>> = {};
    for (const card of cards) {
      const overridesMap: Record<number, MonthOverride> = {};
      for (const o of card.overrides) {
        overridesMap[o.monthNumber] = {
          payment: o.payment,
          purchases: o.purchases,
        };
      }
      results[card.id] = generateProjection(
        {
          balance: card.currentBalance,
          interestRate: card.interestRate,
          computation: card.computation,
          targetPayment: card.targetPayment,
        },
        overridesMap
      );
    }
    return results;
  }, [cards]);

  const globalStats = useMemo(() => {
    let totalBalance = 0;
    let totalInterest = 0;
    let maxMonths = 0;
    const combinedData: Record<string, number>[] = [];

    for (const card of cards) {
      totalBalance += card.currentBalance;
      const proj = projections[card.id];
      if (proj) {
        totalInterest += proj.totalInterest;
        if (proj.months > maxMonths) maxMonths = proj.months;

        for (const [idx, monthData] of proj.data.entries()) {
          if (!combinedData[idx]) {
            combinedData[idx] = { month: idx + 1 } as Record<string, number>;
          }
          const entry = combinedData[idx]!;
          entry["totalBalance"] =
            (entry["totalBalance"] ?? 0) + Math.max(0, monthData.endBalance);
          entry[card.id] = Math.max(0, monthData.endBalance);
        }
      }
    }

    return { totalBalance, totalInterest, maxMonths, combinedData };
  }, [cards, projections]);

  if (cards.length === 0) {
    return (
      <div className="animate-slide-up">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-12 text-center">
          <CreditCard size={48} className="mx-auto text-slate-300 mb-4" />
          <h2 className="text-xl font-bold text-slate-800 mb-2">No credit cards yet</h2>
          <p className="text-slate-500 mb-6">Add your first credit card to start tracking your debt journey.</p>
          <button
            onClick={() => setShowAddCard(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all"
          >
            <PlusCircle size={18} />
            Add Credit Card
          </button>
        </div>
        {showAddCard && <AddCardDialog onClose={() => setShowAddCard(false)} />}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Global Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 text-slate-500 mb-2">
            <Wallet size={18} />
            <span className="font-medium text-sm">Total Current Debt</span>
          </div>
          <div className="text-3xl font-bold text-slate-900">
            {formatCurrency(globalStats.totalBalance)}
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Across {cards.length} card{cards.length !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 text-slate-500 mb-2">
            <TrendingDown size={18} />
            <span className="font-medium text-sm">Projected Total Interest</span>
          </div>
          <div className="text-3xl font-bold text-red-500">
            {formatCurrency(globalStats.totalInterest)}
          </div>
          <p className="text-sm text-slate-400 mt-1">Based on current plan</p>
        </div>

        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-6 rounded-3xl shadow-md text-white">
          <div className="flex items-center gap-2 text-emerald-100 mb-2">
            <Calendar size={18} />
            <span className="font-medium text-sm">Debt Freedom Date</span>
          </div>
          <div className="text-3xl font-bold">
            {Math.floor(globalStats.maxMonths / 12) > 0 &&
              `${Math.floor(globalStats.maxMonths / 12)}y `}
            {globalStats.maxMonths % 12}m
          </div>
          <p className="text-sm text-emerald-100 mt-1">You can accelerate this!</p>
        </div>
      </div>

      {/* Global Chart */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
          <TrendingDown size={20} className="text-slate-400" />
          Total Debt Burndown
        </h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={globalStats.combinedData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="month"
                tickFormatter={(val) => `Mo ${val}`}
                stroke="#94a3b8"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tickFormatter={(val) => `₱${(val / 1000).toFixed(0)}k`}
                stroke="#94a3b8"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                formatter={(val) => formatCurrency(Number(val))}
                labelFormatter={(label) => `Month ${label}`}
                contentStyle={{
                  borderRadius: "16px",
                  border: "none",
                  boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                }}
              />
              {cards.map((card) => (
                <Area
                  key={card.id}
                  type="monotone"
                  dataKey={card.id}
                  stackId="1"
                  stroke={card.color}
                  fill={card.color}
                  fillOpacity={0.6}
                  name={card.name}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Card List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="font-bold text-slate-800 text-lg">Your Credit Accounts</h3>
          <button
            onClick={() => setShowAddCard(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-all"
          >
            <PlusCircle size={16} />
            Add Card
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cards.map((card) => {
            const proj = projections[card.id];
            return (
              <Link
                key={card.id}
                href={`/cards/${card.id}`}
                className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:border-slate-300 hover:shadow-md transition-all group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-sm"
                      style={{ backgroundColor: card.color }}
                    >
                      {card.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 group-hover:text-slate-900 transition-colors">
                        {card.name}
                      </h4>
                      <p className="text-xs text-slate-400">
                        {card.bankName} &middot; {card.computation} Computation
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="text-slate-300 group-hover:text-slate-500 transition-colors" />
                </div>

                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Current Balance</p>
                    <p className="font-semibold text-slate-900">
                      {formatCurrency(card.currentBalance)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Target Payment</p>
                    <p className="font-semibold text-emerald-600">
                      {formatCurrency(card.targetPayment)}/mo
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Est. Payoff</p>
                    <p className="font-semibold text-slate-900">
                      {proj?.months ?? 0} Months
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Total Interest</p>
                    <p className="font-semibold text-red-500">
                      {formatCurrency(proj?.totalInterest ?? 0)}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {showAddCard && <AddCardDialog onClose={() => setShowAddCard(false)} />}
    </div>
  );
}
