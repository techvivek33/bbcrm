import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { createTask } from "@/lib/crud-actions";
import { PageHeader, LinkButton } from "@/components/ui/misc";
import { TextField, TextareaField, SelectField, SubmitButton } from "@/components/ui/form";
import { TASK_PRIORITY, TASK_STATUS } from "@/lib/enums";

export const dynamic = "force-dynamic";

const TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "OUTREACH", label: "Outreach" },
  { value: "NEGOTIATION", label: "Negotiation" },
  { value: "CONTRACT", label: "Contract" },
  { value: "CONTENT_SUBMISSION", label: "Content Submission" },
  { value: "CONTENT_APPROVAL", label: "Content Approval" },
  { value: "POSTING", label: "Posting" },
  { value: "REPORTING", label: "Reporting" },
  { value: "INVOICE", label: "Invoice" },
  { value: "FOLLOW_UP", label: "Follow Up" },
  { value: "OTHER", label: "Other" },
];

const priorityOptions = Object.entries(TASK_PRIORITY).map(function (e) {
  return { value: e[0], label: e[1].label };
});

const statusOptions = Object.entries(TASK_STATUS).map(function (e) {
  return { value: e[0], label: e[1].label };
});

export default async function NewTaskPage() {
  const [users, campaigns] = await Promise.all([
    prisma.user.findMany({
      where: { active: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.campaign.findMany({
      select: { id: true, name: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const assigneeOptions = users.map(function (u) {
    return { value: u.id, label: u.name };
  });

  const campaignOptions: { value: string; label: string }[] = [
    { value: "", label: "— none —" },
    ...campaigns.map(function (c) {
      return { value: c.id, label: c.name };
    }),
  ];

  return (
    <div>
      <PageHeader
        title="New Task"
        subtitle="Create a task and assign it to a teammate. Optionally link it to a campaign."
        actions={
          <LinkButton href="/tasks" variant="secondary">
            <ArrowLeft className="h-4 w-4" /> Back to Tasks
          </LinkButton>
        }
      />

      <form action={createTask}>
        <div className="card card-pad">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextField
              label="Title"
              name="title"
              required
              placeholder="Follow up with brand on content approval"
              className="sm:col-span-2"
            />
            <SelectField label="Type" name="type" options={TYPE_OPTIONS} defaultValue="OUTREACH" />
            <SelectField label="Priority" name="priority" options={priorityOptions} defaultValue="MEDIUM" />
            <SelectField label="Status" name="status" options={statusOptions} defaultValue="PENDING" />
            <TextField label="Due Date" name="dueDate" type="date" />
            <SelectField
              label="Assignee"
              name="assigneeId"
              options={assigneeOptions}
              hint="Who owns this task"
            />
            <SelectField
              label="Campaign"
              name="campaignId"
              options={campaignOptions}
              hint="Optional — link this task to a campaign"
            />
            <TextareaField
              label="Description"
              name="description"
              rows={4}
              placeholder="Add any context, links, or instructions for this task…"
              className="sm:col-span-2"
            />
          </div>

          <div className="mt-6 flex items-center gap-3 border-t border-slate-100 pt-5">
            <SubmitButton>Create Task</SubmitButton>
            <LinkButton href="/tasks" variant="secondary">Cancel</LinkButton>
          </div>
        </div>
      </form>
    </div>
  );
}
