"use client";

import { useRef, useTransition } from "react";
import { Send, Plus } from "lucide-react";
import { addNote, logActivity } from "@/lib/actions";
import { ACTIVITY_TYPE } from "@/lib/enums";

type Target = { brandId?: string; creatorId?: string; campaignId?: string; revalidate: string };

function hidden(target: Target) {
  return (
    <>
      {target.brandId && <input type="hidden" name="brandId" value={target.brandId} />}
      {target.creatorId && <input type="hidden" name="creatorId" value={target.creatorId} />}
      {target.campaignId && <input type="hidden" name="campaignId" value={target.campaignId} />}
      <input type="hidden" name="revalidate" value={target.revalidate} />
    </>
  );
}

export function AddNoteForm(target: Target) {
  const ref = useRef<HTMLFormElement>(null);
  const [pending, start] = useTransition();
  return (
    <form
      ref={ref}
      action={(fd) => start(async () => { await addNote(fd); ref.current?.reset(); })}
      className="border-t border-slate-100 p-4"
    >
      {hidden(target)}
      <textarea
        name="body"
        required
        rows={2}
        placeholder="Add an internal note (visible to team only)…"
        className="focus-ring w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm placeholder:text-slate-400"
      />
      <div className="mt-2 flex justify-end">
        <button
          disabled={pending}
          className="focus-ring inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
        >
          <Plus className="h-4 w-4" /> {pending ? "Adding…" : "Add Note"}
        </button>
      </div>
    </form>
  );
}

export function LogActivityForm(target: Target) {
  const ref = useRef<HTMLFormElement>(null);
  const [pending, start] = useTransition();
  return (
    <form
      ref={ref}
      action={(fd) => start(async () => { await logActivity(fd); ref.current?.reset(); })}
      className="border-t border-slate-100 p-4"
    >
      {hidden(target)}
      <div className="flex gap-2">
        <select
          name="type"
          className="focus-ring rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm text-slate-700"
          defaultValue="CALL"
        >
          {Object.entries(ACTIVITY_TYPE)
            .filter(([k]) => !["STATUS_CHANGE"].includes(k))
            .map(([value, m]) => (
              <option key={value} value={value}>{m.label}</option>
            ))}
        </select>
        <input
          name="title"
          required
          placeholder="Log an interaction… e.g. Called to discuss brief"
          className="focus-ring min-w-0 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm placeholder:text-slate-400"
        />
        <button
          disabled={pending}
          className="focus-ring inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </form>
  );
}
