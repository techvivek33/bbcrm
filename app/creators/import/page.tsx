import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/ui/misc";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { CreatorImport } from "@/components/creators/CreatorImport";
import { IMPORT_COLUMNS } from "@/lib/creator-import";

export const dynamic = "force-dynamic";

export default function CreatorImportPage() {
  return (
    <div>
      <Link href="/creators" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" /> Back to Creators
      </Link>

      <PageHeader
        title="Bulk Import Creators"
        subtitle="Add hundreds of creators at once from an Excel or Google Sheets file — no manual entry."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CreatorImport />
        </div>

        {/* Column reference */}
        <div>
          <Card>
            <CardHeader title="Column format" subtitle="Only Name is required — leave the rest blank if unknown" />
            <ul className="divide-y divide-slate-100">
              {IMPORT_COLUMNS.map((c) => (
                <li key={c.key} className="flex items-start justify-between gap-3 px-5 py-2.5">
                  <div>
                    <p className="text-sm font-medium text-slate-800">
                      {c.header}
                      {c.note === "required" && <span className="ml-1 text-rose-500">*</span>}
                    </p>
                    {c.note && c.note !== "required" && (
                      <p className="text-xs text-slate-400">{c.note}</p>
                    )}
                  </div>
                  {c.note === "required" && <Badge tone="red">required</Badge>}
                </li>
              ))}
            </ul>
            <div className="border-t border-slate-100 p-4 text-xs text-slate-500">
              Tip: creators are imported as <strong>Approved</strong> by default (so they appear in
              Discovery). Set the <strong>Status</strong> column to <code>PENDING</code> to route them
              through Onboarding instead. Rows with a duplicate email are skipped.
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
