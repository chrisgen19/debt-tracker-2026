"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { createCard } from "@/lib/actions";

const COLORS = ["#ef4444", "#3b82f6", "#8b5cf6", "#f59e0b", "#10b981", "#ec4899"];

interface AddCardDialogProps {
  onClose: () => void;
}

export function AddCardDialog({ onClose }: AddCardDialogProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(formData: FormData) {
    const result = await createCard(formData);
    if (result?.error) {
      alert(result.error);
      return;
    }
    onClose();
    router.refresh();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-3xl shadow-xl max-w-lg w-full p-8 animate-slide-up max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-900">Add Credit Card</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form ref={formRef} action={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Card Name
              </label>
              <input
                name="name"
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                placeholder="e.g., BPI Amore Cashback"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Bank Name
              </label>
              <input
                name="bankName"
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                placeholder="e.g., BPI"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Computation Method
              </label>
              <select
                name="computation"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="BPI">BPI (rate*12/360)</option>
                <option value="STANDARD">Standard (rate/30)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Credit Limit
              </label>
              <input
                name="creditLimit"
                type="number"
                step="0.01"
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                placeholder="94000"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Current Balance
              </label>
              <input
                name="currentBalance"
                type="number"
                step="0.01"
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                placeholder="71650.70"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Monthly Interest Rate
              </label>
              <input
                name="interestRate"
                type="number"
                step="0.001"
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                placeholder="0.03 (for 3%)"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Minimum Payment
              </label>
              <input
                name="minPayment"
                type="number"
                step="0.01"
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                placeholder="2558.95"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Target Payment/mo
              </label>
              <input
                name="targetPayment"
                type="number"
                step="0.01"
                required
                className="w-full px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-semibold text-emerald-900"
                placeholder="5000"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Statement Day
              </label>
              <input
                name="statementDay"
                type="number"
                min="1"
                max="31"
                defaultValue="9"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Due Date Day
              </label>
              <input
                name="dueDateDay"
                type="number"
                min="1"
                max="31"
                defaultValue="2"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Card Color
              </label>
              <div className="flex gap-3">
                {COLORS.map((color) => (
                  <label key={color} className="cursor-pointer">
                    <input
                      type="radio"
                      name="color"
                      value={color}
                      defaultChecked={color === "#3b82f6"}
                      className="sr-only peer"
                    />
                    <div
                      className="w-10 h-10 rounded-full peer-checked:ring-4 peer-checked:ring-offset-2 transition-all"
                      style={{ backgroundColor: color }}
                    />
                  </label>
                ))}
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all mt-6"
          >
            Add Card
          </button>
        </form>
      </div>
    </div>
  );
}
