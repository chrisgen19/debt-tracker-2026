import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Debt Freedom Planner",
  description: "Track your credit card debt journey to zero balance",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#f8fafc] font-sans text-slate-800 antialiased selection:bg-indigo-100">
        {children}
      </body>
    </html>
  );
}
