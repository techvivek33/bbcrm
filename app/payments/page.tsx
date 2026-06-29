import Link from "next/link";
import { ArrowDownLeft, ArrowUpRight, BellRing } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/misc";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/misc";
import { inr, dateShort, daysUntil } from "@/lib/format";
import { meta, PAYMENT_STATUS } from "@/lib/enums";

export const dynamic = "force-dynamic";

/** The reminder cadence from the spec: 7d / 3d / due today / overdue. */
function reminder(dueDate: Date | null, status: string) {
  if (status === "PAID" || !dueDate) return null;
  const d = daysUntil(dueDate);
  if (d === null) return null;
  if (d < 0) return { label: `${Math.abs(d)}d overdue`, tone: "red" as const };
  if (d === 0) return { label: "Due today", tone: "red" as const };
  if (d <= 3) return { label: `Due in ${d}d`, tone: "amber" as const };
  if (d <= 7) return { label: `Due in ${d}d`, tone: "blue" as const };
  return null;
}

export default async function PaymentsPage() {
  const payments = await prisma.payment.findMany({
    include: { brand: true, creator: true, campaign: { select: { id: true, name: true } } },
    orderBy: { dueDate: "asc" },
  });

  const brandPayments = payments.filter((p) => p.direction === "BRAND");
  const creatorPayments = payments.filter((p) => p.direction === "CREATOR");

  const receivable = brandPayments.filter((p) => p.status !== "PAID").reduce((s, p) => s + (p.agreedAmount - p.paidAmount), 0);
  const payable = creatorPayments.filter((p) => p.status !== "PAID").reduce((s, p) => s + (p.agreedAmount - p.paidAmount), 0);
  const collected = brandPayments.filter((p) => p.status === "PAID").reduce((s, p) => s + p.paidAmount, 0);
  const overdueCount = payments.filter((p) => p.status === "OVERDUE").length;

  return (
    <div>
      <PageHeader
        title="Payment Management"
        subtitle="Track every rupee in and out — with automated due-date reminders."
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Receivable" value={inr(receivable, { compact: true })} sub="From brands" icon={<ArrowDownLeft className="h-5 w-5" />} tone="green" />
        <StatCard label="Payable" value={inr(payable, { compact: true })} sub="To creators" icon={<ArrowUpRight className="h-5 w-5" />} tone="amber" />
        <StatCard label="Collected" value={inr(collected, { compact: true })} sub="Lifetime" tone="blue" />
        <StatCard label="Overdue" value={overdueCount} sub="Need follow-up" icon={<BellRing className="h-5 w-5" />} tone="red" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <PaymentTable
          title="Brand Receivables"
          subtitle="Money owed to the agency"
          rows={brandPayments.map((p) => ({
            id: p.id,
            name: p.brand?.companyName ?? "—",
            color: p.brand?.logoColor ?? "#64748b",
            href: p.brand ? `/brands/${p.brand.id}` : undefined,
            campaign: p.campaign?.name ?? null,
            agreed: p.agreedAmount,
            paid: p.paidAmount,
            status: p.status,
            dueDate: p.dueDate,
          }))}
        />
        <PaymentTable
          title="Creator Payables"
          subtitle="Payouts due to creators"
          rows={creatorPayments.map((p) => ({
            id: p.id,
            name: p.creator?.name ?? "—",
            color: p.creator?.avatarColor ?? "#64748b",
            href: p.creator ? `/creators/${p.creator.id}` : undefined,
            campaign: p.campaign?.name ?? null,
            agreed: p.agreedAmount,
            paid: p.paidAmount,
            status: p.status,
            dueDate: p.dueDate,
          }))}
        />
      </div>
    </div>
  );
}

type Row = {
  id: string;
  name: string;
  color: string;
  href?: string;
  campaign: string | null;
  agreed: number;
  paid: number;
  status: string;
  dueDate: Date | null;
};

function PaymentTable({ title, subtitle, rows }: { title: string; subtitle: string; rows: Row[] }) {
  return (
    <Card>
      <CardHeader title={title} subtitle={subtitle} />
      <div className="divide-y divide-slate-100">
        {rows.length === 0 && <p className="px-5 py-6 text-sm text-slate-500">Nothing here.</p>}
        {rows.map((r) => {
          const ps = meta(PAYMENT_STATUS, r.status);
          const rem = reminder(r.dueDate, r.status);
          const pct = r.agreed ? Math.round((r.paid / r.agreed) * 100) : 0;
          return (
            <div key={r.id} className="px-5 py-3.5">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold text-white" style={{ backgroundColor: r.color }}>
                  {r.name.slice(0, 2).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  {r.href ? (
                    <Link href={r.href} className="text-sm font-semibold text-slate-900 hover:text-brand-600">{r.name}</Link>
                  ) : (
                    <p className="text-sm font-semibold text-slate-900">{r.name}</p>
                  )}
                  {r.campaign && <p className="truncate text-xs text-slate-500">{r.campaign}</p>}
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-900">{inr(r.agreed, { compact: true })}</p>
                  <p className="text-xs text-slate-400">Due {dateShort(r.dueDate)}</p>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1"><ProgressBar value={pct} tone={r.status === "OVERDUE" ? "red" : r.status === "PAID" ? "green" : "brand"} /></div>
                <Badge tone={ps.tone}>{ps.label}</Badge>
                {rem && <Badge tone={rem.tone}><BellRing className="mr-0.5 h-3 w-3" />{rem.label}</Badge>}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
