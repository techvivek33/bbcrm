"use client";

import { useState, useTransition } from "react";
import { Check, RefreshCw, X } from "lucide-react";
import { reviewContent } from "@/lib/actions";

export function ReviewActions({
  submissionId,
  status,
}: {
  submissionId: string;
  status: string;
}) {
  const [comment, setComment] = useState("");
  const [pending, start] = useTransition();

  const act = (side: "INTERNAL" | "BRAND", decision: "APPROVED" | "REVISION" | "REJECTED") =>
    start(async () => {
      await reviewContent(submissionId, side, decision, comment);
      setComment("");
    });

  // Decide which actions apply for the current submission state.
  const internalPending = status === "PENDING_REVIEW";
  const brandPending = status === "INTERNAL_APPROVED";
  const decided = ["BRAND_APPROVED", "REJECTED", "REVISION_REQUESTED"].includes(status);

  if (decided) {
    return (
      <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
        This version has been actioned. Upload a new version to continue the workflow.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={2}
        placeholder="Add review feedback (optional)…"
        className="focus-ring w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400"
      />
      <div className="flex flex-wrap gap-2">
        {internalPending && (
          <>
            <button
              disabled={pending}
              onClick={() => act("INTERNAL", "APPROVED")}
              className="focus-ring inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              <Check className="h-4 w-4" /> Approve & send to brand
            </button>
            <button
              disabled={pending}
              onClick={() => act("INTERNAL", "REVISION")}
              className="focus-ring inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3.5 py-2 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-60"
            >
              <RefreshCw className="h-4 w-4" /> Request revision
            </button>
            <button
              disabled={pending}
              onClick={() => act("INTERNAL", "REJECTED")}
              className="focus-ring inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3.5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-60"
            >
              <X className="h-4 w-4" /> Reject
            </button>
          </>
        )}
        {brandPending && (
          <>
            <button
              disabled={pending}
              onClick={() => act("BRAND", "APPROVED")}
              className="focus-ring inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              <Check className="h-4 w-4" /> Brand approve for posting
            </button>
            <button
              disabled={pending}
              onClick={() => act("BRAND", "REVISION")}
              className="focus-ring inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3.5 py-2 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-60"
            >
              <RefreshCw className="h-4 w-4" /> Request changes
            </button>
          </>
        )}
      </div>
    </div>
  );
}
