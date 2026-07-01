import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Phone, Mail, Building2, Trash2, PhoneCall } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { PageHeader } from "@/components/ui/misc";
import { TextField, TextareaField, SelectField, SubmitButton } from "@/components/ui/form";
import { updateColdCall, deleteColdCall } from "@/lib/crud-actions";
import { meta, COLD_CALL_STATUS } from "@/lib/enums";
import { relative } from "@/lib/format";

export const dynamic = "force-dynamic";

const ymd = (d: Date | null) => (d ? new Date(d).toISOString().slice(0, 10) : "");

export default async function ColdCallDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const l = await prisma.coldCall.findUnique({ where: { id } });
  if (!l) notFound();

  const s = meta(COLD_CALL_STATUS, l.status);
  const statusOptions = Object.entries(COLD_CALL_STATUS).map(([value, m]) => ({ value, label: m.label }));
  const followUps = [
    { n: 1, date: l.fu1Date, note: l.fu1Note },
    { n: 2, date: l.fu2Date, note: l.fu2Note },
    { n: 3, date: l.fu3Date, note: l.fu3Note },
    { n: 4, date: l.fu4Date, note: l.fu4Note },
    { n: 5, date: l.fu5Date, note: l.fu5Note },
    { n: 6, date: l.fu6Date, note: l.fu6Note },
  ];

  return (
    <div>
      <Link href="/cold-calls" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" /> Back to Cold Calls
      </Link>

      {/* Header */}
      <div className="card card-pad mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            <PhoneCall className="h-6 w-6" />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">{l.name}</h1>
              <Badge tone={s.tone} dot>{s.label}</Badge>
            </div>
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
              {l.company && <span className="inline-flex items-center gap-1.5"><Building2 className="h-4 w-4 text-slate-400" /> {l.company}</span>}
              {l.number && <a href={`tel:${l.number}`} className="inline-flex items-center gap-1.5 hover:text-brand-600"><Phone className="h-4 w-4 text-slate-400" /> {l.number}</a>}
              {l.email && <a href={`mailto:${l.email}`} className="inline-flex items-center gap-1.5 hover:text-brand-600"><Mail className="h-4 w-4 text-slate-400" /> {l.email}</a>}
            </div>
            <p className="mt-1 text-xs text-slate-400">Updated {relative(l.updatedAt)}</p>
          </div>
        </div>
        <form action={deleteColdCall.bind(null, l.id)}>
          <button className="focus-ring inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50">
            <Trash2 className="h-4 w-4" /> Delete
          </button>
        </form>
      </div>

      {/* Edit form: lead details + follow-ups saved together */}
      <form action={updateColdCall}>
        <input type="hidden" name="id" value={l.id} />

        <Card className="mb-6">
          <CardHeader title="Lead Details" />
          <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
            <TextField label="Name" name="name" required defaultValue={l.name} />
            <TextField label="Company" name="company" defaultValue={l.company ?? ""} />
            <TextField label="Number" name="number" defaultValue={l.number ?? ""} />
            <TextField label="Email" name="email" type="email" defaultValue={l.email ?? ""} />
            <SelectField label="Status" name="status" options={statusOptions} defaultValue={l.status} />
            <TextField label="Assigned To" name="assignee" defaultValue={l.assignee ?? ""} />
            <TextareaField label="Pitch" name="pitch" className="sm:col-span-2" defaultValue={l.pitch ?? ""} />
            <TextareaField label="Remarks" name="remarks" className="sm:col-span-2" defaultValue={l.remarks ?? ""} />
          </div>
        </Card>

        <Card className="mb-6">
          <CardHeader title="Follow-ups" subtitle="Log up to 6 touches — a date and what happened each time" />
          <div className="divide-y divide-slate-100">
            {followUps.map((f) => (
              <div key={f.n} className="grid grid-cols-1 gap-3 px-5 py-4 sm:grid-cols-[auto_160px_1fr] sm:items-start">
                <span className="mt-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-500">
                  {f.n}
                </span>
                <TextField label="Date" name={`fu${f.n}Date`} type="date" defaultValue={ymd(f.date)} />
                <TextField label="Update" name={`fu${f.n}Note`} defaultValue={f.note ?? ""} placeholder="What happened on this follow-up?" />
              </div>
            ))}
          </div>
        </Card>

        <div className="flex items-center gap-2">
          <SubmitButton>Save Changes</SubmitButton>
          <Link href="/cold-calls" className="focus-ring rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
