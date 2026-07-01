import { notFound } from "next/navigation";
import { Hexagon, Users, Eye, Activity, IndianRupee, Target } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { StatCard } from "@/components/ui/StatCard";
import { Field } from "@/components/ui/misc";
import { PrintButton } from "@/components/proposals/PrintButton";
import { inr, compactNumber, fullNumber, percent, dateLong } from "@/lib/format";
import type { BadgeTone } from "@/lib/enums";

export const dynamic = "force-dynamic";

function fitTone(score: number): BadgeTone {
  if (score >= 80) return "green";
  if (score >= 60) return "blue";
  if (score >= 40) return "amber";
  return "gray";
}

// Public, no-login proposal view. Reachable ONLY via its unguessable token;
// the token maps to exactly one proposal, so no other proposal is exposed.
export default async function PublicProposal({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const proposal = await prisma.proposal.findUnique({
    where: { publicId: token },
    include: {
      brand: true,
      items: { include: { creator: true }, orderBy: { fitScore: "desc" } },
    },
  });
  if (!proposal) notFound();

  const totalReach = proposal.items.reduce((s, it) => s + (it.creator?.totalFollowers ?? 0), 0);
  const totalAvgViews = proposal.items.reduce((s, it) => s + (it.creator?.avgViews ?? 0), 0);
  const totalCost = proposal.items.reduce((s, it) => s + it.proposedAmount, 0);
  const estEngagement = proposal.items.reduce(
    (s, it) => s + Math.round(((it.creator?.totalFollowers ?? 0) * (it.creator?.engagementRate ?? 0)) / 100),
    0,
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Branded header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white">
              <Hexagon className="h-5 w-5" />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-bold text-slate-900">Agency OS</p>
              <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Campaign Proposal</p>
            </div>
          </div>
          <PrintButton />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-8">
        {/* Title */}
        <div className="mb-6">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{proposal.title}</h1>
            <Badge tone="blue">Proposal</Badge>
          </div>
          <p className="text-sm text-slate-500">
            Prepared{proposal.brand ? ` for ${proposal.brand.companyName}` : ""} · {dateLong(proposal.createdAt)}
          </p>
        </div>

        {/* Metrics */}
        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Total Reach" value={compactNumber(totalReach)} sub={`${proposal.items.length} creators`} icon={<Users className="h-5 w-5" />} tone="violet" />
          <StatCard label="Avg. Views" value={compactNumber(totalAvgViews)} sub="Combined per post" icon={<Eye className="h-5 w-5" />} tone="blue" />
          <StatCard label="Est. Engagement" value={compactNumber(estEngagement)} sub="Likes + comments" icon={<Activity className="h-5 w-5" />} tone="cyan" />
          <StatCard label="Total Cost" value={inr(totalCost, { compact: true })} sub={proposal.budget ? `Budget ${inr(proposal.budget, { compact: true })}` : "Proposed spend"} icon={<IndianRupee className="h-5 w-5" />} tone="green" />
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
                  return (
                    <tr key={it.id}>
                      <td className="px-5 py-3">
                        {c ? (
                          <div className="flex items-center gap-3">
                            <Avatar name={c.name} color={c.avatarColor} size="md" />
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-900">{c.name}</p>
                              <p className="text-xs text-slate-500">{c.city ?? "—"}</p>
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-slate-700">{it.deliverable ?? "—"}</td>
                      <td className="px-5 py-3 text-right font-medium text-slate-700">{compactNumber(c?.totalFollowers ?? 0)}</td>
                      <td className="hidden px-5 py-3 text-right text-slate-600 md:table-cell">{compactNumber(c?.avgViews ?? 0)}</td>
                      <td className="hidden px-5 py-3 text-right text-slate-600 md:table-cell">{percent(c?.engagementRate ?? 0)}</td>
                      <td className="px-5 py-3 text-center"><Badge tone={fitTone(it.fitScore ?? 0)}>{it.fitScore ?? "—"}</Badge></td>
                      <td className="px-5 py-3 text-right font-semibold text-slate-900">{inr(it.proposedAmount)}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t border-slate-200 bg-slate-50/60">
                  <td className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400" colSpan={2}>Total</td>
                  <td className="px-5 py-3 text-right font-semibold text-slate-700">{compactNumber(totalReach)}</td>
                  <td className="hidden px-5 py-3 text-right font-semibold text-slate-700 md:table-cell">{compactNumber(totalAvgViews)}</td>
                  <td className="hidden px-5 py-3 md:table-cell" />
                  <td className="px-5 py-3" />
                  <td className="px-5 py-3 text-right font-bold text-slate-900">{inr(totalCost)}</td>
                </tr>
              </tfoot>
            </table>
          )}
        </Card>

        {/* Brief */}
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
            <Field label="Indicative Budget">{proposal.budget ? inr(proposal.budget) : "—"}</Field>
            <Field label="Combined Reach">{fullNumber(totalReach)} followers</Field>
            <Field label="Estimated Engagement">{fullNumber(estEngagement)} interactions</Field>
          </dl>
        </Card>

        <p className="mt-8 text-center text-xs text-slate-400">
          Powered by <span className="font-semibold text-slate-500">Agency OS</span> · This is a live proposal shared by your agency.
        </p>
      </main>
    </div>
  );
}
