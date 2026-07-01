"use client";

import { useTransition } from "react";
import { CheckCircle2, XCircle, Printer } from "lucide-react";
import { updateProposalStatus } from "@/lib/crud-actions";
import { cn } from "@/lib/utils";

type ActionTone = "primary" | "green" | "red" | "secondary";

const TONE: Record<ActionTone, string> = {
  primary: "bg-brand-600 text-white hover:bg-brand-700",
  green: "bg-emerald-600 text-white hover:bg-emerald-700",
  red: "border border-rose-200 bg-white text-rose-600 hover:bg-rose-50",
  secondary: "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
};

export function ProposalStatusActions({
  proposalId,
  status,
}: {
  proposalId: string;
  status: string;
}) {
  const [pending, start] = useTransition();

  function setStatus(next: string) {
    start(function () {
      updateProposalStatus(proposalId, next);
    });
  }

  function btn(label: string, icon: React.ReactNode, tone: ActionTone, onClick: () => void, active: boolean) {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={pending || active}
        className={cn(
          "focus-ring inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors disabled:opacity-60",
          TONE[tone],
          active && "ring-2 ring-offset-1 ring-slate-300",
        )}
      >
        {icon}
        {label}
      </button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2 print:hidden">
      {btn("Mark Accepted", <CheckCircle2 className="h-4 w-4" />, "green", () => setStatus("ACCEPTED"), status === "ACCEPTED")}
      {btn("Mark Declined", <XCircle className="h-4 w-4" />, "red", () => setStatus("DECLINED"), status === "DECLINED")}
      <button
        type="button"
        onClick={() => window.print()}
        className={cn(
          "focus-ring inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors",
          TONE.secondary,
        )}
      >
        <Printer className="h-4 w-4" />
        Export PDF
      </button>
    </div>
  );
}
