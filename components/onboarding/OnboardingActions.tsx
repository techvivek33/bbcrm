"use client";

import { useTransition } from "react";
import { Check, ShieldCheck, X } from "lucide-react";
import { updateCreatorStatus } from "@/lib/crud-actions";

export function OnboardingActions({
  creatorId,
  status,
}: {
  creatorId: string;
  status: string;
}) {
  const [pending, start] = useTransition();

  const act = (next: "IN_VERIFICATION" | "APPROVED" | "REJECTED") =>
    start(async () => {
      await updateCreatorStatus(creatorId, next);
    });

  return (
    <div className="flex flex-wrap gap-2">
      {status === "PENDING" && (
        <button
          disabled={pending}
          onClick={() => act("IN_VERIFICATION")}
          className="focus-ring inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        >
          <ShieldCheck className="h-4 w-4" /> Move to Verification
        </button>
      )}
      <button
        disabled={pending}
        onClick={() => act("APPROVED")}
        className="focus-ring inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
      >
        <Check className="h-4 w-4" /> Approve
      </button>
      <button
        disabled={pending}
        onClick={() => act("REJECTED")}
        className="focus-ring inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3.5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-60"
      >
        <X className="h-4 w-4" /> Reject
      </button>
    </div>
  );
}
