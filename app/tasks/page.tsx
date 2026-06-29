import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader, LinkButton } from "@/components/ui/misc";
import { StatCard } from "@/components/ui/StatCard";
import { TaskBoard, type TaskRow } from "@/components/tasks/TaskBoard";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const tasks = await prisma.task.findMany({
    include: { assignee: true, campaign: { select: { id: true, name: true } } },
    orderBy: [{ dueDate: "asc" }],
  });

  const rows: TaskRow[] = tasks.map((t) => ({
    id: t.id,
    title: t.title,
    type: t.type,
    status: t.status,
    priority: t.priority,
    dueDate: t.dueDate ? t.dueDate.toISOString() : null,
    campaignName: t.campaign?.name ?? null,
    campaignId: t.campaign?.id ?? null,
    assignee: t.assignee ? { name: t.assignee.name, avatarColor: t.assignee.avatarColor } : null,
  }));

  const open = rows.filter((t) => t.status !== "COMPLETED").length;
  const overdue = rows.filter((t) => t.status === "OVERDUE").length;
  const waiting = rows.filter((t) => t.status === "WAITING_APPROVAL").length;
  const done = rows.filter((t) => t.status === "COMPLETED").length;

  return (
    <div>
      <PageHeader
        title="Task Management"
        subtitle="Every campaign auto-generates tasks. Track, assign, and never drop a ball."
        actions={
          <LinkButton href="/tasks/new">
            <Plus className="h-4 w-4" /> New Task
          </LinkButton>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Open Tasks" value={open} tone="blue" />
        <StatCard label="Waiting Approval" value={waiting} tone="amber" />
        <StatCard label="Overdue" value={overdue} tone="red" />
        <StatCard label="Completed" value={done} tone="green" />
      </div>

      <TaskBoard tasks={rows} />
    </div>
  );
}
