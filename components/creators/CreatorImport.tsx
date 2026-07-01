"use client";

import { useActionState, useRef, useState } from "react";
import Link from "next/link";
import { UploadCloud, FileSpreadsheet, CheckCircle2, AlertTriangle, Download } from "lucide-react";
import { importCreators, type ImportResult } from "@/lib/import-actions";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export function CreatorImport() {
  const [state, formAction, pending] = useActionState<ImportResult | null, FormData>(importCreators, null);
  const [fileName, setFileName] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-6">
      {/* Step 1 — download */}
      <Card>
        <CardHeader title="Step 1 — Download the template" subtitle="A ready-made Excel sheet with the correct headings + 2 example rows" />
        <div className="flex flex-wrap items-center justify-between gap-3 p-5">
          <p className="max-w-md text-sm text-slate-600">
            Open it in <strong>Excel</strong> or <strong>Google Sheets</strong>, replace the example
            rows with your creators (keep the header row), then save as <code>.xlsx</code> or
            <code> .csv</code>.
          </p>
          <Link
            href="/creators/import/template"
            prefetch={false}
            className="focus-ring inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700"
          >
            <Download className="h-4 w-4" /> Download Template (.xlsx)
          </Link>
        </div>
      </Card>

      {/* Step 2 — upload */}
      <Card>
        <CardHeader title="Step 2 — Upload your filled sheet" subtitle="We'll create every valid row as a creator" />
        <form action={formAction} className="p-5">
          <label
            className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center transition-colors hover:border-brand-300 hover:bg-brand-50"
          >
            <UploadCloud className="h-8 w-8 text-slate-400" />
            {fileName ? (
              <span className="flex items-center gap-2 text-sm font-medium text-slate-800">
                <FileSpreadsheet className="h-4 w-4 text-emerald-500" /> {fileName}
              </span>
            ) : (
              <>
                <span className="text-sm font-medium text-slate-700">Click to choose a file</span>
                <span className="text-xs text-slate-400">.xlsx, .xls or .csv</span>
              </>
            )}
            <input
              ref={inputRef}
              type="file"
              name="file"
              accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
              required
              className="hidden"
              onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")}
            />
          </label>

          <div className="mt-4 flex items-center justify-end gap-2">
            {fileName && (
              <button
                type="button"
                onClick={() => { setFileName(""); if (inputRef.current) inputRef.current.value = ""; }}
                className="focus-ring rounded-lg border border-slate-200 px-3.5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Clear
              </button>
            )}
            <button
              type="submit"
              disabled={pending || !fileName}
              className="focus-ring inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
            >
              <UploadCloud className="h-4 w-4" /> {pending ? "Importing…" : "Upload & Import"}
            </button>
          </div>
        </form>
      </Card>

      {/* Results */}
      {state && (
        <Card>
          <CardHeader
            title="Import result"
            action={
              state.created > 0 ? (
                <Link href="/creators" className="text-sm font-medium text-brand-600 hover:text-brand-700">
                  View creators →
                </Link>
              ) : undefined
            }
          />
          <div className="p-5">
            {state.message && (
              <div
                className={`mb-4 flex items-center gap-2 rounded-lg px-4 py-3 text-sm ${
                  state.created > 0 ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                }`}
              >
                {state.created > 0 ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                {state.message}
              </div>
            )}
            {state.ok && (
              <div className="mb-4 flex flex-wrap gap-2">
                <Badge tone="green">{state.created} created</Badge>
                {state.skipped > 0 && <Badge tone="amber">{state.skipped} skipped</Badge>}
                <Badge tone="gray">{state.total} rows read</Badge>
              </div>
            )}
            {state.errors.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Rows needing attention
                </p>
                <ul className="max-h-56 space-y-1 overflow-y-auto rounded-lg border border-slate-100 bg-slate-50 p-3 text-sm">
                  {state.errors.map((e, i) => (
                    <li key={i} className="text-slate-600">
                      <span className="font-medium text-slate-800">Row {e.row}:</span> {e.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
