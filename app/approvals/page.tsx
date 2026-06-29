import Link from "next/link";
import { CheckCircle2, Film, ArrowRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader, EmptyState } from "@/components/ui/misc";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { dateShort, relative } from "@/lib/format";
import { meta, DELIVERABLE_STATUS } from "@/lib/enums";

export const dynamic = "force-dynamic";

const QUEUES = [
  { key: "INTERNAL_REVIEW", title: "Needs Internal Review", subtitle: "Your team reviews first", statuses: ["SUBMITTED", "INTERNAL_REVIEW"] },
  { key: "BRAND_REVIEW", title: "Awaiting Brand Approval", subtitle: "Sent to the brand POC", statuses: ["BRAND_REVIEW"] },
  { key: "REVISION", title: "In Revision", subtitle: "Back with the creator", statuses: ["REVISION"] },
];

export default async function ApprovalsPage() {
  const deliverables = await prisma.deliverable.findMany({
    where: { status: { in: ["SUBMITTED", "INTERNAL_REVIEW", "BRAND_REVIEW", "REVISION"] } },
    include: {
      creator: true,
      campaign: { include: { brand: true } },
      submissions: { orderBy: { version: "desc" }, take: 1 },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        title="Content Approvals"
        subtitle="One workflow for every submission — versioned, tracked, and brand-ready. No more WhatsApp."
      />

      {deliverables.length === 0 ? (
        <EmptyState icon={<CheckCircle2 className="h-8 w-8" />} title="Inbox zero 🎉" description="Nothing is waiting for review right now." />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {QUEUES.map((q) => {
            const items = deliverables.filter((d) => q.statuses.includes(d.status));
            return (
              <Card key={q.key}>
                <CardHeader title={q.title} subtitle={q.subtitle} action={<Badge tone="gray">{items.length}</Badge>} />
                {items.length === 0 ? (
                  <p className="px-5 py-6 text-sm text-slate-400">Nothing here.</p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {items.map((d) => {
                      const ds = meta(DELIVERABLE_STATUS, d.status);
                      const latest = d.submissions[0];
                      return (
                        <Link key={d.id} href={`/approvals/${d.id}`} className="hover-row block px-5 py-3">
                          <div className="flex items-center gap-2">
                            <Film className="h-4 w-4 shrink-0 text-slate-400" />
                            <p className="min-w-0 flex-1 truncate text-sm font-medium text-slate-900">{d.title}</p>
                            {latest && <Badge tone="gray">v{latest.version}</Badge>}
                          </div>
                          <div className="mt-1.5 flex items-center gap-2">
                            {d.creator && <Avatar name={d.creator.name} color={d.creator.avatarColor} size="sm" />}
                            <span className="min-w-0 flex-1 truncate text-xs text-slate-500">
                              {d.campaign.brand.companyName} · {d.creator?.name ?? "—"}
                            </span>
                            <Badge tone={ds.tone}>{ds.label}</Badge>
                          </div>
                          <p className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
                            <span>due {dateShort(d.dueDate)}</span>
                            <span className="inline-flex items-center gap-0.5">
                              {latest ? relative(latest.submittedAt) : ""} <ArrowRight className="h-3 w-3" />
                            </span>
                          </p>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
