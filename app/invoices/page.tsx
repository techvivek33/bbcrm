import Link from "next/link";
import { Plus, FileText, Wallet, AlertTriangle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader, LinkButton, EmptyState } from "@/components/ui/misc";
import { StatCard } from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/Badge";
import { LinkRow } from "@/components/ui/LinkRow";
import { Toolbar } from "@/components/ui/Toolbar";
import { inr, dateShort } from "@/lib/format";
import { meta, INVOICE_STATUS } from "@/lib/enums";

export const dynamic = "force-dynamic";

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { q, status } = await searchParams;

  const invoices = await prisma.invoice.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(q
        ? {
            OR: [
              { number: { contains: q } },
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
    orderBy: { issuedDate: "desc" },
  });

  const totalInvoiced = invoices.reduce((s, i) => s + i.total, 0);
  const collected = invoices.filter((i) => i.status === "PAID").reduce((s, i) => s + i.total, 0);
  const outstanding = invoices
    .filter((i) => i.status === "SENT" || i.status === "OVERDUE")
    .reduce((s, i) => s + i.total, 0);
  const overdueCount = invoices.filter((i) => i.status === "OVERDUE").length;

  return (
    <div>
      <PageHeader
        title="Invoice Generator"
        subtitle="Raise GST-ready invoices for brands and creators, and track collections."
        actions={
          <LinkButton href="/invoices/new">
            <Plus className="h-4 w-4" /> New Invoice
          </LinkButton>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Invoiced" value={inr(totalInvoiced, { compact: true })} sub={`${invoices.length} invoices`} icon={<FileText className="h-5 w-5" />} tone="blue" />
        <StatCard label="Collected" value={inr(collected, { compact: true })} sub="Marked paid" icon={<Wallet className="h-5 w-5" />} tone="green" />
        <StatCard label="Outstanding" value={inr(outstanding, { compact: true })} sub="Sent / overdue" tone="amber" />
        <StatCard label="Overdue" value={overdueCount} sub="Need follow-up" icon={<AlertTriangle className="h-5 w-5" />} tone="red" />
      </div>

      <Toolbar
        placeholder="Search by number, brand or creator…"
        filters={{
          key: "status",
          label: "Status",
          values: Object.entries(INVOICE_STATUS).map(([value, m]) => ({ value, label: m.label })),
        }}
      />

      {invoices.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-8 w-8" />}
          title="No invoices found"
          description="Adjust your filters or generate a new invoice."
        />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                <th className="px-5 py-3">Number</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">Party</th>
                <th className="hidden px-5 py-3 sm:table-cell">Issued</th>
                <th className="hidden px-5 py-3 md:table-cell">Due</th>
                <th className="px-5 py-3 text-right">Total</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.map((inv) => {
                const s = meta(INVOICE_STATUS, inv.status);
                const party = inv.brand?.companyName ?? inv.creator?.name ?? "—";
                return (
                  <LinkRow key={inv.id} href={`/invoices/${inv.id}`}>
                    <td className="px-5 py-3">
                      <Link href={`/invoices/${inv.id}`} className="font-semibold text-slate-900 hover:text-brand-600">
                        {inv.number}
                      </Link>
                    </td>
                    <td className="px-5 py-3">
                      <Badge tone="gray">{inv.type}</Badge>
                    </td>
                    <td className="px-5 py-3 text-slate-700">{party}</td>
                    <td className="hidden px-5 py-3 text-slate-500 sm:table-cell">{dateShort(inv.issuedDate)}</td>
                    <td className="hidden px-5 py-3 text-slate-500 md:table-cell">{dateShort(inv.dueDate)}</td>
                    <td className="px-5 py-3 text-right font-semibold text-slate-800">{inr(inv.total)}</td>
                    <td className="px-5 py-3"><Badge tone={s.tone} dot>{s.label}</Badge></td>
                  </LinkRow>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
