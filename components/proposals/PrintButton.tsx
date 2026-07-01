"use client";

import { Printer } from "lucide-react";

export function PrintButton({ label = "Download PDF" }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="focus-ring inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 print:hidden"
    >
      <Printer className="h-4 w-4" /> {label}
    </button>
  );
}
