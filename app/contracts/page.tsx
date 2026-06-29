import Link from "next/link";
import { Plus, FileSignature, CheckCircle2, Send, Clock } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader, LinkButton, EmptyState } from "@/components/ui/misc";
import { StatCard } from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/Badge";
import { Toolbar } from "@/components/ui/Toolbar";
import { dateShort, daysUntil } from "@/lib/format";
import { meta, CONTRACT_STATUS } from "@/lib/enums";

export const dynamic = "force-dynamic";

export default async function ContractsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { q, status } = await searchParams;

  const contracts = await prisma.contract.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q } },
              { brand: { is: { companyName: { contains: q } } } },
              { creator: { is: { name: { contains: q } } } },
            ],
          }
        : {}),
    },
    include: {
      brand: { select: { companyName: true } },
      creator: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const total = contracts.length;
  const signed = contracts.filter((c) => c.status === "SIGNED").length;
  const awaiting = contracts.filter((c) => c.status === "SENT").length;
  const expiringSoon = contracts.filter((c) => {
    if (c.status === "EXPIRED") return false;
    const d = daysUntil(c.expiryDate);
    return d !== null && d >= 0 && d <= 60;
  }).length;

  return (
    <div>
      <PageHeader
        title="Contract Management"
        subtitle="Draft, send, e-sign and renew every brand and creator agreement in one place."
        actions={
          <LinkButton href="/contracts/new">
            <Plus className="h-4 w-4" /> New Contract
          </LinkButton>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Contracts" value={total} sub="On file" icon={<FileSignature className="h-5 w-5" />} tone="blue" />
        <StatCard label="Signed" value={signed} sub="Fully executed" icon={<CheckCircle2 className="h-5 w-5" />} tone="green" />
        <StatCard label="Awaiting Signature" value={awaiting} sub="Sent, not signed" icon={<Send className="h-5 w-5" />} tone="amber" />
        <StatCard label="Expiring Soon" value={expiringSoon} sub="Within 60 days" icon={<Clock className="h-5 w-5" />} tone="red" />
      </div>

      <Toolbar
        placeholder="Search by title, brand or creator…"
        filters={{
          key: "status",
          label: "Status",
          values: Object.entries(CONTRACT_STATUS).map(([value, m]) => ({ value, label: m.label })),
        }}
      />

      {contracts.length === 0 ? (
        <EmptyState
          icon={<FileSignature className="h-8 w-8" />}
          title="No contracts found"
          description="Adjust your filters or draft a new contract to get started."
        />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                <th className="px-5 py-3">Title</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">Party</th>
                <th className="px-5 py-3">Status</th>
                <th className="hidden px-5 py-3 sm:table-cell">Signed</th>
                <th className="px-5 py-3">Expiry</th>
                <th className="hidden px-5 py-3 md:table-cell">Renewal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {contracts.map((c) => {
                const s = meta(CONTRACT_STATUS, c.status);
                const party = c.brand?.companyName ?? c.creator?.name ?? "—";
                const expDays = daysUntil(c.expiryDate);
                const expiryWarn = expDays !== null && expDays < 30 && c.status !== "EXPIRED";
                return (
                  <tr key={c.id} className="hover-row">
                    <td className="px-5 py-3">
                      <Link href={`/contracts/${c.id}`} className="font-semibold text-slate-900 hover:text-brand-600">
                        {c.title}
                      </Link>
                    </td>
                    <td className="px-5 py-3">
                      <Badge tone="gray">{c.type}</Badge>
                    </td>
                    <td className="px-5 py-3 text-slate-700">{party}</td>
                    <td className="px-5 py-3"><Badge tone={s.tone} dot>{s.label}</Badge></td>
                    <td className="hidden px-5 py-3 text-slate-500 sm:table-cell">{dateShort(c.signedDate)}</td>
                    <td className="px-5 py-3">
                      {c.expiryDate ? (
                        <span className={expiryWarn ? "font-semibold text-rose-600" : "text-slate-500"}>
                          {dateShort(c.expiryDate)}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="hidden px-5 py-3 text-slate-500 md:table-cell">{dateShort(c.renewalReminderDate)}</td>
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
