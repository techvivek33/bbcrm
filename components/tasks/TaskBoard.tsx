"use client";

import { useTransition } from "react";
import Link from "next/link";
import { CalendarClock } from "lucide-react";
import { updateTaskStatus } from "@/lib/actions";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { meta, TASK_STATUS, TASK_STATUS_ORDER, TASK_PRIORITY } from "@/lib/enums";
import { dateShort, isOverdue } from "@/lib/format";
import { cn } from "@/lib/utils";

export type TaskRow = {
  id: string;
  title: string;
  type: string;
  status: string;
  priority: string;
  dueDate: string | null;
  campaignName: string | null;
  campaignId: string | null;
  assignee: { name: string; avatarColor: string } | null;
};

export function TaskBoard({ tasks }: { tasks: TaskRow[] }) {
  const [pending, start] = useTransition();

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {TASK_STATUS_ORDER.map((status) => {
        const m = meta(TASK_STATUS, status);
        const items = tasks.filter((t) => t.status === status);
        return (
          <div key={status} className="flex w-72 shrink-0 flex-col">
            <div className="mb-2 flex items-center justify-between px-1">
              <Badge tone={m.tone}>{m.label}</Badge>
              <span className="text-xs font-medium text-slate-400">{items.length}</span>
            </div>
            <div className="flex flex-1 flex-col gap-2 rounded-xl bg-slate-100/60 p-2">
              {items.length === 0 ? (
                <p className="px-2 py-6 text-center text-xs text-slate-400">No tasks</p>
              ) : (
                items.map((t) => {
                  const tp = meta(TASK_PRIORITY, t.priority);
                  const overdue = isOverdue(t.dueDate) && t.status !== "COMPLETED";
                  return (
                    <div
                      key={t.id}
                      className={cn(
                        "rounded-xl border bg-white p-3 shadow-sm transition-opacity",
                        overdue ? "border-rose-200" : "border-slate-200",
                        pending && "opacity-70",
                      )}
                    >
                      <div className="mb-1.5 flex items-start gap-2">
                        <p className="flex-1 text-sm font-medium leading-snug text-slate-900">{t.title}</p>
                        <Badge tone={tp.tone}>{tp.label}</Badge>
                      </div>
                      {t.campaignName && (
                        <Link href={`/campaigns/${t.campaignId}`} className="text-xs text-slate-500 hover:text-brand-600">
                          {t.campaignName}
                        </Link>
                      )}
                      <div className="mt-2 flex items-center justify-between">
                        <span className={cn("inline-flex items-center gap-1 text-[11px]", overdue ? "text-rose-600 font-medium" : "text-slate-400")}>
                          <CalendarClock className="h-3 w-3" /> {dateShort(t.dueDate)}
                        </span>
                        {t.assignee && <Avatar name={t.assignee.name} color={t.assignee.avatarColor} size="sm" />}
                      </div>
                      <select
                        value={t.status}
                        onChange={(e) => start(() => updateTaskStatus(t.id, e.target.value))}
                        disabled={pending}
                        className="focus-ring mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-600"
                      >
                        {TASK_STATUS_ORDER.map((s) => (
                          <option key={s} value={s}>
                            Move to: {TASK_STATUS[s].label}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
