import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader, LinkButton } from "@/components/ui/misc";
import { Card } from "@/components/ui/Card";
import { TextField, TextareaField, SelectField, SubmitButton } from "@/components/ui/form";
import { createColdCall } from "@/lib/crud-actions";
import { COLD_CALL_STATUS } from "@/lib/enums";

export const dynamic = "force-dynamic";

export default function NewColdCallPage() {
  const statusOptions = Object.entries(COLD_CALL_STATUS).map(([value, m]) => ({ value, label: m.label }));

  return (
    <div>
      <Link href="/cold-calls" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" /> Back to Cold Calls
      </Link>

      <PageHeader title="Add Lead" subtitle="Capture a new cold-call lead. You can log follow-ups after saving." />

      <Card className="card-pad">
        <form action={createColdCall} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField label="Name" name="name" required placeholder="Contact person" />
          <TextField label="Company" name="company" placeholder="Company / brand" />
          <TextField label="Number" name="number" placeholder="Phone" />
          <TextField label="Email" name="email" type="email" placeholder="name@company.com" />
          <SelectField label="Status" name="status" options={statusOptions} defaultValue="NEW" />
          <TextField label="Assigned To" name="assignee" placeholder="Team member (optional)" />
          <TextareaField label="Pitch" name="pitch" className="sm:col-span-2" placeholder="What are we pitching?" />
          <TextareaField label="Remarks" name="remarks" className="sm:col-span-2" placeholder="Notes about this lead…" />
          <div className="flex items-center gap-2 sm:col-span-2">
            <SubmitButton>Add Lead</SubmitButton>
            <LinkButton href="/cold-calls" variant="secondary">Cancel</LinkButton>
          </div>
        </form>
      </Card>
    </div>
  );
}
