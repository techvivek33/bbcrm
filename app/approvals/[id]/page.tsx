import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Film, MessageSquare, Layers, Building2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { ReviewActions } from "@/components/approvals/ReviewActions";
import { dateShort, relative } from "@/lib/format";
import { meta, DELIVERABLE_STATUS } from "@/lib/enums";

export const dynamic = "force-dynamic";

const SUB_STATUS: Record<string, { label: string; tone: "gray" | "blue" | "green" | "amber" | "red" | "violet" }> = {
  PENDING_REVIEW: { label: "Pending Review", tone: "blue" },
  INTERNAL_APPROVED: { label: "Internal Approved → Brand", tone: "violet" },
  BRAND_APPROVED: { label: "Brand Approved", tone: "green" },
  REVISION_REQUESTED: { label: "Revision Requested", tone: "amber" },
  REJECTED: { label: "Rejected", tone: "red" },
};

export default async function ApprovalDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const d = await prisma.deliverable.findUnique({
    where: { id },
    include: {
      creator: true,
      campaign: { include: { brand: true } },
      submissions: {
        orderBy: { version: "desc" },
        include: { reviews: { orderBy: { createdAt: "asc" }, include: { reviewer: true } } },
      },
    },
  });
  if (!d) notFound();

  const ds = meta(DELIVERABLE_STATUS, d.status);
  const latest = d.submissions[0];

  return (
    <div>
      <Link href="/approvals" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" /> Back to Approvals
      </Link>

      {/* Header */}
      <div className="card card-pad mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
            <Film className="h-6 w-6" />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-slate-900">{d.title}</h1>
              <Badge tone={ds.tone} dot>{ds.label}</Badge>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              <Link href={`/campaigns/${d.campaign.id}`} className="hover:text-brand-600">{d.campaign.name}</Link>
              {" · "}{d.type}{" · due "}{dateShort(d.dueDate)}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-600">
              <span className="inline-flex items-center gap-1.5"><Building2 className="h-4 w-4 text-slate-400" /> {d.campaign.brand.companyName}</span>
              {d.creator && (
                <span className="inline-flex items-center gap-1.5">
                  <Avatar name={d.creator.name} color={d.creator.avatarColor} size="sm" /> {d.creator.name}
                </span>
              )}
            </div>
          </div>
        </div>
        <Badge tone="gray" className="text-sm"><Layers className="mr-1 h-3.5 w-3.5" /> {d.submissions.length} version{d.submissions.length === 1 ? "" : "s"}</Badge>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Review panel for latest version */}
        <div className="lg:col-span-2">
          {latest && (
            <Card className="mb-6">
              <CardHeader
                title={`Review — Version ${latest.version}`}
                subtitle="Approve, send to the brand, or request a revision"
                action={<Badge tone={SUB_STATUS[latest.status]?.tone ?? "gray"}>{SUB_STATUS[latest.status]?.label ?? latest.status}</Badge>}
              />
              <div className="space-y-4 p-5">
                {/* Media placeholder */}
                <div className="flex aspect-video items-center justify-center rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 text-slate-400">
                  <div className="text-center">
                    <Film className="mx-auto h-10 w-10" />
                    <p className="mt-2 text-xs">Content preview (v{latest.version})</p>
                  </div>
                </div>
                {latest.caption && (
                  <div className="rounded-lg bg-slate-50 px-4 py-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Caption</p>
                    <p className="mt-1 text-sm text-slate-700">{latest.caption}</p>
                  </div>
                )}
                <ReviewActions submissionId={latest.id} status={latest.status} />
              </div>
            </Card>
          )}

          {/* Version history */}
          <Card>
            <CardHeader title="Version History" subtitle="Full audit trail — every version & decision" />
            <ol className="divide-y divide-slate-100">
              {d.submissions.map((s) => (
                <li key={s.id} className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <Badge tone="gray">v{s.version}</Badge>
                    <span className="flex-1 text-sm text-slate-600">{s.caption}</span>
                    <Badge tone={SUB_STATUS[s.status]?.tone ?? "gray"}>{SUB_STATUS[s.status]?.label ?? s.status}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">Submitted {relative(s.submittedAt)}</p>
                  {s.reviews.length > 0 && (
                    <ul className="mt-2 space-y-1.5 border-l-2 border-slate-100 pl-3">
                      {s.reviews.map((r) => (
                        <li key={r.id} className="text-xs text-slate-500">
                          <span className="inline-flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            <span className="font-medium text-slate-700">{r.side === "BRAND" ? "Brand" : "Internal"}</span>
                            {" · "}
                            <Badge tone={r.decision === "APPROVED" ? "green" : r.decision === "REVISION" ? "amber" : "red"}>{r.decision}</Badge>
                          </span>
                          {r.comment && <span className="ml-1 italic">“{r.comment}”</span>}
                          {r.reviewer && <span className="ml-1">— {r.reviewer.name}</span>}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ol>
          </Card>
        </div>

        {/* Workflow guide */}
        <div>
          <Card>
            <CardHeader title="Approval Flow" />
            <ol className="space-y-3 p-5 text-sm">
              {[
                { n: 1, t: "Creator uploads", d: "Video / reel / caption submitted as a version." },
                { n: 2, t: "Internal review", d: "Your team approves or requests a revision." },
                { n: 3, t: "Brand review", d: "Brand POC approves or asks for changes." },
                { n: 4, t: "Posted", d: "Approved content goes live; metrics tracked." },
              ].map((step) => (
                <li key={step.n} className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">{step.n}</span>
                  <div>
                    <p className="font-medium text-slate-800">{step.t}</p>
                    <p className="text-xs text-slate-500">{step.d}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </div>
    </div>
  );
}
