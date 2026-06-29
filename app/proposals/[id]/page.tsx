import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Eye, IndianRupee, Users, Activity, Target } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { StatCard } from "@/components/ui/StatCard";
import { Field } from "@/components/ui/misc";
import { ProposalStatusActions } from "@/components/proposals/ProposalStatusActions";
import { inr, compactNumber, fullNumber, percent, dateLong } from "@/lib/format";
import type { BadgeTone } from "@/lib/enums";

export const dynamic = "force-dynamic";

/** Local status map for proposals (not in shared enums). */
const PROPOSAL_STATUS: Record<string, { label: string; tone: BadgeTone }> = {
  DRAFT: { label: "Draft", tone: "gray" },
  SHARED: { label: "Shared", tone: "blue" },
  ACCEPTED: { label: "Accepted", tone: "green" },
  DECLINED: { label: "Declined", tone: "red" },
};

function pmeta(key: string) {
  return PROPOSAL_STATUS[key] ?? { label: key, tone: "gray" as BadgeTone };
}

/** Fit score → tone band. */
function fitTone(score: number): BadgeTone {
  if (score >= 80) return "green";
  if (score >= 60) return "blue";
  if (score >= 40) return "amber";
  return "gray";
}

export default async function ProposalDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const proposal = await prisma.proposal.findUnique({
    where: { id },
    include: {
      brand: true,
      items: { include: { creator: true }, orderBy: { fitScore: "desc" } },
    },
  });
  if (!proposal) notFound();

  const s = pmeta(proposal.status);

  const totalReach = proposal.items.reduce((sum: number, it) => sum + (it.creator?.totalFollowers ?? 0), 0);
  const totalAvgViews = proposal.items.reduce((sum: number, it) => sum + (it.creator?.avgViews ?? 0), 0);
  const totalCost = proposal.items.reduce((sum: number, it) => sum + it.proposedAmount, 0);
  const estEngagement = proposal.items.reduce(
    (sum: number, it) => sum + Math.round(((it.creator?.totalFollowers ?? 0) * (it.creator?.engagementRate ?? 0)) / 100),
    0,
  );

  return (
    <div>
      <Link
        href="/proposals"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 print:hidden"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Proposals
      </Link>

      {/* Header */}
      <div className="card card-pad mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{proposal.title}</h1>
            <Badge tone={s.tone} dot>{s.label}</Badge>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Prepared for{" "}
            {proposal.brand ? (
              <Link href={`/brands/${proposal.brand.id}`} className="font-medium text-slate-700 hover:text-brand-600">
                {proposal.brand.companyName}
              </Link>
            ) : (
              <span className="text-slate-400">an unassigned brand</span>
            )}
            {" · "}
            {dateLong(proposal.createdAt)}
          </p>
        </div>
        <ProposalStatusActions proposalId={proposal.id} status={proposal.status} />
      </div>

      {/* Headline metrics */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Total Reach"
          value={compactNumber(totalReach)}
          sub={`${proposal.items.length} creators`}
          icon={<Users className="h-5 w-5" />}
          tone="violet"
        />
        <StatCard
          label="Avg. Views"
          value={compactNumber(totalAvgViews)}
          sub="Combined per post"
          icon={<Eye className="h-5 w-5" />}
          tone="blue"
        />
        <StatCard
          label="Est. Engagement"
          value={compactNumber(estEngagement)}
          sub="Likes + comments"
          icon={<Activity className="h-5 w-5" />}
          tone="cyan"
        />
        <StatCard
          label="Total Cost"
          value={inr(totalCost, { compact: true })}
          sub={proposal.budget ? `Budget ${inr(proposal.budget, { compact: true })}` : "Proposed spend"}
          icon={<IndianRupee className="h-5 w-5" />}
          tone="green"
        />
      </div>

      {/* Shortlist */}
      <Card className="mb-6 overflow-hidden">
        <CardHeader title="Recommended Creators" subtitle={`${proposal.items.length} in this line-up`} />
        {proposal.items.length === 0 ? (
          <p className="px-5 py-6 text-sm text-slate-500">No creators on this proposal yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                <th className="px-5 py-3">Creator</th>
                <th className="px-5 py-3">Deliverable</th>
                <th className="px-5 py-3 text-right">Reach</th>
                <th className="hidden px-5 py-3 text-right md:table-cell">Avg. Views</th>
                <th className="hidden px-5 py-3 text-right md:table-cell">ER</th>
                <th className="px-5 py-3 text-center">Fit</th>
                <th className="px-5 py-3 text-right">Proposed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {proposal.items.map((it) => {
                const c = it.creator;
                const ft = fitTone(it.fitScore ?? 0);
                return (
                  <tr key={it.id} className="hover-row">
                    <td className="px-5 py-3">
                      {c ? (
                        <Link href={`/creators/${c.id}`} className="flex items-center gap-3">
                          <Avatar name={c.name} color={c.avatarColor} size="md" />
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900">{c.name}</p>
                            <p className="text-xs text-slate-500">{c.city ?? "—"}</p>
                          </div>
                        </Link>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-slate-700">{it.deliverable ?? "—"}</td>
                    <td className="px-5 py-3 text-right font-medium text-slate-700">
                      {compactNumber(c?.totalFollowers ?? 0)}
                    </td>
                    <td className="hidden px-5 py-3 text-right text-slate-600 md:table-cell">
                      {compactNumber(c?.avgViews ?? 0)}
                    </td>
                    <td className="hidden px-5 py-3 text-right text-slate-600 md:table-cell">
                      {percent(c?.engagementRate ?? 0)}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <Badge tone={ft}>{it.fitScore ?? "—"}</Badge>
                    </td>
                    <td className="px-5 py-3 text-right font-semibold text-slate-900">{inr(it.proposedAmount)}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t border-slate-200 bg-slate-50/60">
                <td className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400" colSpan={2}>
                  Total
                </td>
                <td className="px-5 py-3 text-right font-semibold text-slate-700">{compactNumber(totalReach)}</td>
                <td className="hidden px-5 py-3 text-right font-semibold text-slate-700 md:table-cell">
                  {compactNumber(totalAvgViews)}
                </td>
                <td className="hidden px-5 py-3 md:table-cell" />
                <td className="px-5 py-3" />
                <td className="px-5 py-3 text-right font-bold text-slate-900">{inr(totalCost)}</td>
              </tr>
            </tfoot>
          </table>
        )}
      </Card>

      {/* Brief & audience */}
      <Card>
        <CardHeader title="The Brief" subtitle="What we're pitching and who it's for" />
        <dl className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="Brief">
              <p className="whitespace-pre-wrap leading-relaxed text-slate-700">{proposal.brief ?? "—"}</p>
            </Field>
          </div>
          <Field label="Target Audience">
            <span className="inline-flex items-center gap-1.5 text-slate-700">
              <Target className="h-4 w-4 text-slate-400" />
              {proposal.audience ?? "—"}
            </span>
          </Field>
          <Field label="Indicative Budget">
            {proposal.budget ? inr(proposal.budget) : "—"}
          </Field>
          <Field label="Combined Reach">{fullNumber(totalReach)} followers</Field>
          <Field label="Estimated Engagement">{fullNumber(estEngagement)} interactions</Field>
        </dl>
      </Card>
    </div>
  );
}
