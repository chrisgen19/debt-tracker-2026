"use client";

import { TrendingDown, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

interface AppHeaderProps {
  userName: string;
}

export function AppHeader({ userName }: AppHeaderProps) {
  return (
    <div className="flex items-center justify-between px-2">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-200">
          <TrendingDown size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Debt Freedom Planner
          </h1>
          <p className="text-sm font-medium text-slate-500">
            Welcome back, {userName}
          </p>
        </div>
      </div>
      <button
        onClick={() => signOut({ callbackUrl: "/" })}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-800 hover:bg-white rounded-xl transition-all"
      >
        <LogOut size={16} />
        Sign Out
      </button>
    </div>
  );
}
