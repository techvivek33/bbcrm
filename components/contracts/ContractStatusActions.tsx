"use client";

import { useState, useTransition } from "react";
import { Send, PenLine, CheckCircle2, ShieldCheck } from "lucide-react";
import { updateContractStatus } from "@/lib/crud-actions";
import { cn } from "@/lib/utils";

export function ContractStatusActions({
  contractId,
  status,
}: {
  contractId: string;
  status: string;
}) {
  const [pending, start] = useTransition();
  const [typedName, setTypedName] = useState("");
  const [agreed, setAgreed] = useState(false);

  const act = (next: "SENT" | "SIGNED") =>
    start(async () => {
      await updateContractStatus(contractId, next);
    });

  const signed = status === "SIGNED";
  const expired = status === "EXPIRED";
  const canSign = typedName.trim().length > 1 && agreed && !pending && !signed;

  const btn =
    "focus-ring inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors disabled:opacity-50";

  return (
    <div className="space-y-5">
      {/* Step 1 — send for signature */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          disabled={pending || status === "SENT" || signed || expired}
          onClick={() => act("SENT")}
          className={cn(btn, "bg-blue-600 text-white hover:bg-blue-700")}
        >
          <Send className="h-4 w-4" /> Send for signature
        </button>
        {status === "DRAFT" && (
          <span className="text-xs text-slate-500">Currently a draft — send it to collect a signature.</span>
        )}
        {status === "SENT" && (
          <span className="text-xs text-amber-600">Sent — awaiting counter-signature below.</span>
        )}
      </div>

      {/* Simulated e-signature pad */}
      <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
          <PenLine className="h-4 w-4 text-brand-600" /> e-Signature
        </div>

        {signed ? (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            <CheckCircle2 className="h-4 w-4" />
            This contract has been signed and executed.
          </div>
        ) : (
          <>
            <label className="mb-1 block text-xs font-medium text-slate-500">Type your full name to sign</label>
            <input
              value={typedName}
              onChange={(e) => setTypedName(e.target.value)}
              placeholder="e.g. Aanya Mehra"
              disabled={pending || expired}
              className="focus-ring w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 disabled:bg-slate-100"
            />
            <div
              className="mt-2 flex h-14 items-end border-b-2 border-slate-300 px-1 pb-1"
              aria-hidden="true"
            >
              <span
                className={cn(
                  "text-2xl text-slate-700",
                  typedName.trim() ? "opacity-100" : "opacity-30",
                )}
                style={{ fontFamily: "cursive" }}
              >
                {typedName.trim() || "Signature"}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">Signature line — typed name is captured as the e-sign mark.</p>

            <label className="mt-3 flex items-start gap-2 text-xs text-slate-600">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                disabled={pending || expired}
                className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 text-brand-600 focus-ring"
              />
              <span>I have read and agree to the terms of this agreement, and consent to signing electronically.</span>
            </label>

            <button
              disabled={!canSign}
              onClick={() => act("SIGNED")}
              className={cn(btn, "mt-3 w-full justify-center bg-emerald-600 text-white hover:bg-emerald-700")}
            >
              <ShieldCheck className="h-4 w-4" /> {pending ? "Signing…" : "Mark as signed"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
