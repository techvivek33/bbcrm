import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Eye, TrendingUp, Radio, Heart, Film } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Field } from "@/components/ui/misc";
import { Timeline } from "@/components/detail/Timeline";
import { NoteList } from "@/components/detail/NoteList";
import { AddNoteForm } from "@/components/detail/Composers";
import { StagePipeline } from "@/components/campaign/StagePipeline";
import { inr, compactNumber, dateShort } from "@/lib/format";
import {
  meta,
  CAMPAIGN_STAGES,
  DELIVERABLE_STATUS,
  TASK_STATUS,
  TASK_PRIORITY,
} from "@/lib/enums";

export const dynamic = "force-dynamic";

export default async function CampaignDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const c = await prisma.campaign.findUnique({
    where: { id },
    include: {
      brand: true,
      creators: { include: { creator: true } },
      deliverables: { include: { creator: true }, orderBy: { dueDate: "asc" } },
      tasks: { include: { assignee: true }, orderBy: { dueDate: "asc" } },
      activities: { orderBy: { occurredAt: "desc" }, include: { user: true } },
      noteItems: { include: { author: true } },
    },
  });
  if (!c) notFound();

  const stage = meta(CAMPAIGN_STAGES, c.stage);
  const target = { campaignId: c.id, revalidate: `/campaigns/${c.id}` };

  return (
    <div>
      <Link href="/campaigns" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" /> Back to Pipeline
      </Link>

      {/* Header */}
      <div className="card card-pad mb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-lg font-bold text-white" style={{ backgroundColor: c.brand.logoColor }}>
              {c.brand.companyName.slice(0, 2).toUpperCase()}
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">{c.name}</h1>
                <Badge tone={stage.tone} dot>{stage.label}</Badge>
              </div>
              <Link href={`/brands/${c.brand.id}`} className="text-sm text-slate-500 hover:text-brand-600">{c.brand.companyName}</Link>
              <p className="mt-2 max-w-2xl text-sm text-slate-600">{c.description}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400">Budget</p>
            <p className="text-2xl font-bold text-slate-900">{inr(c.budget, { compact: true })}</p>
            <p className="mt-1 text-xs text-slate-400">{dateShort(c.startDate)} → {dateShort(c.endDate)}</p>
          </div>
        </div>
      </div>

      {/* Pipeline */}
      <Card className="mb-6">
        <CardHeader title="Campaign Pipeline" subtitle="Move the campaign through its lifecycle" />
        <StagePipeline campaignId={c.id} current={c.stage} />
      </Card>

      {/* Performance metrics */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Reach", value: compactNumber(c.reach), icon: <Radio className="h-4 w-4" /> },
          { label: "Impressions", value: compactNumber(c.impressions), icon: <Eye className="h-4 w-4" /> },
          { label: "Views", value: compactNumber(c.views), icon: <Film className="h-4 w-4" /> },
          { label: "Engagement", value: compactNumber(c.engagement), icon: <Heart className="h-4 w-4" /> },
        ].map((m) => (
          <div key={m.label} className="card card-pad">
            <div className="flex items-center gap-1.5 text-slate-400">{m.icon}<span className="text-xs font-medium">{m.label}</span></div>
            <p className="mt-1 text-xl font-bold text-slate-900">{m.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Creator roster */}
          <Card>
            <CardHeader title="Creator Roster" subtitle={`${c.creators.length} creators`} />
            <div className="divide-y divide-slate-100">
              {c.creators.map((cc) => (
                <div key={cc.id} className="flex items-center gap-3 px-5 py-3">
                  <Avatar name={cc.creator.name} color={cc.creator.avatarColor} size="md" />
                  <Link href={`/creators/${cc.creator.id}`} className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900 hover:text-brand-600">{cc.creator.name}</p>
                    <p className="text-xs text-slate-500">{compactNumber(cc.creator.totalFollowers)} followers</p>
                  </Link>
                  <span className="text-sm font-semibold text-slate-700">{inr(cc.agreedAmount, { compact: true })}</span>
                  <Badge tone={cc.status === "ACTIVE" || cc.status === "APPROVED" || cc.status === "COMPLETED" ? "green" : cc.status === "DECLINED" ? "red" : "amber"}>
                    {cc.status.charAt(0) + cc.status.slice(1).toLowerCase()}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>

          {/* Deliverables + approval status */}
          <Card>
            <CardHeader title="Deliverables & Content Approvals" subtitle="Replaces WhatsApp file chaos" />
            <div className="divide-y divide-slate-100">
              {c.deliverables.map((d) => {
                const ds = meta(DELIVERABLE_STATUS, d.status);
                return (
                  <Link key={d.id} href={`/approvals/${d.id}`} className="hover-row flex items-center gap-3 px-5 py-3">
                    <Film className="h-4 w-4 shrink-0 text-slate-400" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900">{d.title}</p>
                      <p className="text-xs text-slate-500">{d.creator?.name ?? "Unassigned"} · {d.type} · due {dateShort(d.dueDate)}</p>
                    </div>
                    {d.status === "POSTED" && <span className="text-xs text-slate-500">{compactNumber(d.views)} views</span>}
                    <Badge tone={ds.tone}>{ds.label}</Badge>
                  </Link>
                );
              })}
            </div>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader title="Campaign Activity" />
            <Timeline items={c.activities} />
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader title="Brief" />
            <dl className="space-y-3 p-5">
              <Field label="Platform">{c.platform}</Field>
              <Field label="Target Audience">{c.targetAudience}</Field>
              <Field label="Creator Requirement">{c.creatorRequirement}</Field>
            </dl>
          </Card>

          {/* Tasks */}
          <Card>
            <CardHeader title="Tasks" subtitle={`${c.tasks.length} linked`} />
            {c.tasks.length === 0 ? (
              <p className="px-5 py-6 text-sm text-slate-500">No tasks yet.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {c.tasks.map((t) => {
                  const ts = meta(TASK_STATUS, t.status);
                  const tp = meta(TASK_PRIORITY, t.priority);
                  return (
                    <li key={t.id} className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <p className="flex-1 text-sm font-medium text-slate-800">{t.title}</p>
                        <Badge tone={tp.tone}>{tp.label}</Badge>
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                        <Badge tone={ts.tone}>{ts.label}</Badge>
                        {t.assignee && <span>· {t.assignee.name}</span>}
                        <span>· due {dateShort(t.dueDate)}</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader title="Internal Notes" />
            <NoteList notes={c.noteItems} />
            <AddNoteForm {...target} />
          </Card>
        </div>
      </div>
    </div>
  );
}
