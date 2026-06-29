"use client";

import { useTransition } from "react";
import { Send, CheckCircle2, AlertTriangle, XCircle, Printer } from "lucide-react";
import { updateInvoiceStatus } from "@/lib/crud-actions";
import { cn } from "@/lib/utils";

export function InvoiceStatusActions({
  invoiceId,
  status,
}: {
  invoiceId: string;
  status: string;
}) {
  const [pending, start] = useTransition();

  const act = (next: "SENT" | "PAID" | "OVERDUE" | "CANCELLED") =>
    start(async () => {
      await updateInvoiceStatus(invoiceId, next);
    });

  const btn =
    "focus-ring inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors disabled:opacity-60";

  return (
    <div className="flex flex-wrap gap-2 print:hidden">
      <button
        disabled={pending || status === "SENT"}
        onClick={() => act("SENT")}
        className={cn(btn, "bg-blue-600 text-white hover:bg-blue-700")}
      >
        <Send className="h-4 w-4" /> Mark Sent
      </button>
      <button
        disabled={pending || status === "PAID"}
        onClick={() => act("PAID")}
        className={cn(btn, "bg-emerald-600 text-white hover:bg-emerald-700")}
      >
        <CheckCircle2 className="h-4 w-4" /> Mark Paid
      </button>
      <button
        disabled={pending || status === "OVERDUE"}
        onClick={() => act("OVERDUE")}
        className={cn(btn, "border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100")}
      >
        <AlertTriangle className="h-4 w-4" /> Mark Overdue
      </button>
      <button
        disabled={pending || status === "CANCELLED"}
        onClick={() => act("CANCELLED")}
        className={cn(btn, "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50")}
      >
        <XCircle className="h-4 w-4" /> Cancel
      </button>
      <button
        onClick={() => window.print()}
        className={cn(btn, "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50")}
      >
        <Printer className="h-4 w-4" /> Print / PDF
      </button>
    </div>
  );
}
