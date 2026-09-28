"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Loader2, Save } from "lucide-react";
import { createTransaction, updateTransaction } from "@/lib/actions";
import { toDateInputValue } from "@/lib/utils";
import {
  TRANSACTION_TYPES,
  transactionUpdateSchema,
  type TransactionFormValues,
  type TransactionUpdateInput,
} from "@/schemas/card";
import type { TransactionItem } from "@/types/statement";

interface TransactionFormDialogProps {
  statementId: string;
  transaction?: TransactionItem;
  onClose: () => void;
}

const INPUT_CLASS =
  "w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none";

function getDefaultValues(transaction?: TransactionItem): TransactionFormValues {
  if (!transaction) {
    return { date: "", postDate: "", description: "", amount: "", type: "purchase" };
  }
  return {
    date: toDateInputValue(transaction.date),
    postDate: toDateInputValue(transaction.postDate),
    description: transaction.description,
    amount: Math.abs(transaction.amount).toString(),
    type: transaction.type as TransactionFormValues["type"],
  };
}

export function TransactionFormDialog({
  statementId,
  transaction,
  onClose,
}: TransactionFormDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const isEdit = transaction !== undefined;

  const { register, handleSubmit, getValues, setValue, formState: { errors } } =
    useForm<TransactionFormValues, unknown, TransactionUpdateInput>({
      resolver: zodResolver(transactionUpdateSchema),
      defaultValues: getDefaultValues(transaction),
    });

  function onSubmit(values: TransactionUpdateInput) {
    setError("");
    startTransition(async () => {
      const result = isEdit
        ? await updateTransaction(transaction.id, values)
        : await createTransaction({ ...values, statementId });

      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
      onClose();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-3xl shadow-xl max-w-lg w-full p-6 sm:p-8 animate-slide-up max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-900">
            {isEdit ? "Edit Transaction" : "Add Transaction"}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm rounded-xl px-4 py-3 mb-4 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <Field label="Description" error={errors.description?.message}>
            <input
              type="text"
              placeholder="e.g. GRAB, MAKATI"
              className={INPUT_CLASS}
              {...register("description")}
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Date" error={errors.date?.message}>
              <input
                type="date"
                className={INPUT_CLASS}
                {...register("date", {
                  // Default the post date to the transaction date on first pick
                  onChange: (e) => {
                    if (!getValues("postDate")) setValue("postDate", e.target.value);
                  },
                })}
              />
            </Field>
            <Field label="Post Date" error={errors.postDate?.message}>
              <input type="date" className={INPUT_CLASS} {...register("postDate")} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Type" error={errors.type?.message}>
              <select className={`${INPUT_CLASS} capitalize`} {...register("type")}>
                {TRANSACTION_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Amount (₱)" error={errors.amount?.message}>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                className={`${INPUT_CLASS} font-semibold`}
                {...register("amount")}
              />
            </Field>
          </div>

          <p className="text-xs text-slate-500">
            Enter a positive amount. Payments are saved as credits automatically.
          </p>

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isPending ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            {isEdit ? "Save Changes" : "Add Transaction"}
          </button>
        </form>
      </div>
    </div>
  );
}

interface FieldProps {
  label: string;
  error?: string;
  children: ReactNode;
}

function Field({ label, error, children }: FieldProps) {
  return (
    <label className="block">
      <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
        {label}
      </span>
      {children}
      {error && <span className="block text-xs text-red-600 font-medium mt-1">{error}</span>}
    </label>
  );
}
