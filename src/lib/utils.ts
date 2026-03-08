import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(value);
}

export function formatMonth(monthNumber: number, startDate?: Date): string {
  const start = startDate ?? new Date();
  const date = new Date(start.getFullYear(), start.getMonth() + monthNumber - 1);
  return date.toLocaleDateString("en-PH", { month: "short", year: "numeric" });
}
