import Link from "next/link";
import { Plus, FileText } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader, LinkButton, EmptyState } from "@/components/ui/misc";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { inr, dateShort } from "@/lib/format";
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

export default async function ProposalsPage() {
  const proposals = await prisma.proposal.findMany({
    include: {
      brand: true,
      items: { include: { creator: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        title="Proposal Builder"
        subtitle="Craft client-ready creator line-ups with reach, engagement and pricing in one click."
        actions={
          <LinkButton href="/proposals/new">
            <Plus className="h-4 w-4" /> New Proposal
          </LinkButton>
        }
      />

      {proposals.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-8 w-8" />}
          title="No proposals yet"
          description="Build your first proposal: pick a brand, shortlist creators, and share a polished pitch."
        />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                <th className="px-5 py-3">Proposal</th>
                <th className="hidden px-5 py-3 md:table-cell">Brand</th>
                <th className="px-5 py-3 text-center">Creators</th>
                <th className="px-5 py-3 text-right">Proposed</th>
                <th className="hidden px-5 py-3 lg:table-cell">Created</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {proposals.map((p) => {
                const s = pmeta(p.status);
                const total = p.items.reduce((sum: number, it) => sum + it.proposedAmount, 0);
                return (
                  <tr key={p.id} className="hover-row">
                    <td className="px-5 py-3">
                      <Link href={`/proposals/${p.id}`} className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                          <FileText className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900">{p.title}</p>
                          <p className="text-xs text-slate-500 md:hidden">{p.brand?.companyName ?? "—"}</p>
                        </div>
                      </Link>
                    </td>
                    <td className="hidden px-5 py-3 md:table-cell">
                      {p.brand ? (
                        <Link href={`/brands/${p.brand.id}`} className="text-slate-700 hover:text-brand-600">
                          {p.brand.companyName}
                        </Link>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-center">
                        <div className="flex -space-x-2">
                          {p.items.slice(0, 4).map((it) => (
                            <Avatar
                              key={it.id}
                              name={it.creator?.name ?? "?"}
                              color={it.creator?.avatarColor ?? "#64748b"}
                              size="sm"
                            />
                          ))}
                        </div>
                        {p.items.length > 4 && (
                          <span className="ml-2 text-xs font-medium text-slate-500">+{p.items.length - 4}</span>
                        )}
                        {p.items.length === 0 && <span className="text-slate-400">0</span>}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right font-semibold text-slate-700">
                      {inr(total, { compact: true })}
                    </td>
                    <td className="hidden px-5 py-3 text-slate-500 lg:table-cell">{dateShort(p.createdAt)}</td>
                    <td className="px-5 py-3">
                      <Badge tone={s.tone} dot>{s.label}</Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
