"use client";

import { useEffect, useState, useTransition } from "react";
import { Share2, Copy, Check, ExternalLink, Link2Off } from "lucide-react";
import { enableProposalShare, disableProposalShare } from "@/lib/crud-actions";
import { cn } from "@/lib/utils";

export function ProposalShare({
  proposalId,
  publicId,
}: {
  proposalId: string;
  publicId: string | null;
}) {
  const [pending, start] = useTransition();
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => setOrigin(window.location.origin), []);

  const url = publicId ? `${origin}/p/${publicId}` : "";

  function copy() {
    if (!url) return;
    navigator.clipboard?.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }

  // Not yet shared → single "Share" button that mints the link.
  if (!publicId) {
    return (
      <button
        type="button"
        onClick={() => start(() => enableProposalShare(proposalId))}
        disabled={pending}
        className="focus-ring inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60 print:hidden"
      >
        <Share2 className="h-4 w-4" />
        {pending ? "Generating…" : "Share"}
      </button>
    );
  }

  // Shared → link box with copy / open / revoke.
  return (
    <div className="w-full max-w-xl rounded-xl border border-brand-200 bg-brand-50/60 p-3 print:hidden">
      <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-brand-700">
        <Share2 className="h-3.5 w-3.5" /> Public share link
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <input
          readOnly
          value={url || `…/p/${publicId}`}
          onFocus={(e) => e.currentTarget.select()}
          className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
        />
        <button
          type="button"
          onClick={copy}
          className={cn(
            "focus-ring inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            copied ? "bg-emerald-600 text-white" : "bg-slate-900 text-white hover:bg-slate-700",
          )}
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? "Copied" : "Copy"}
        </button>
        <a
          href={`/p/${publicId}`}
          target="_blank"
          rel="noreferrer"
          className="focus-ring inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <ExternalLink className="h-4 w-4" /> Open
        </a>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <p className="text-xs text-slate-500">Anyone with this link can view — no login needed.</p>
        <button
          type="button"
          onClick={() => start(() => disableProposalShare(proposalId))}
          disabled={pending}
          className="focus-ring inline-flex items-center gap-1 text-xs font-medium text-rose-600 hover:text-rose-700 disabled:opacity-60"
        >
          <Link2Off className="h-3.5 w-3.5" /> {pending ? "Revoking…" : "Revoke link"}
        </button>
      </div>
    </div>
  );
}
