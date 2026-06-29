import Link from "next/link";
import { TrendingUp, ArrowUpRight, Wallet, Percent, BarChart3, Building2, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader, EmptyState } from "@/components/ui/misc";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardHeader } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { inr, percent } from "@/lib/format";

export const dynamic = "force-dynamic";

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

type MonthBucket = { key: string; label: string; revenue: number; cost: number };
type BrandAgg = { id: string; name: string; color: string; revenue: number };
type CreatorAgg = { id: string; name: string; color: string; payout: number };

export default async function RevenuePage() {
  const payments = await prisma.payment.findMany({
    include: {
      brand: { select: { id: true, companyName: true, logoColor: true } },
      creator: { select: { id: true, name: true, avatarColor: true } },
      campaign: { select: { id: true, name: true } },
    },
    orderBy: { paidDate: "asc" },
  });

  const brandPaid = payments.filter((p) => p.direction === "BRAND");
  const creatorPaid = payments.filter((p) => p.direction === "CREATOR");

  const totalRevenue = brandPaid.reduce((s, p) => s + p.paidAmount, 0);
  const totalPayouts = creatorPaid.reduce((s, p) => s + p.paidAmount, 0);
  const grossProfit = totalRevenue - totalPayouts;
  const margin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

  // ---- Build the last-6-month buckets (oldest -> newest) -------------------
  const now = new Date();
  const buckets: MonthBucket[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({
      key: `${d.getFullYear()}-${d.getMonth()}`,
      label: MONTH_LABELS[d.getMonth()],
      revenue: 0,
      cost: 0,
    });
  }
  const bucketIndex = new Map<string, number>();
  buckets.forEach((b, idx) => bucketIndex.set(b.key, idx));

  for (const p of payments) {
    if (!p.paidDate || p.paidAmount <= 0) continue;
    const d = new Date(p.paidDate);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const idx = bucketIndex.get(key);
    if (idx === undefined) continue;
    if (p.direction === "BRAND") buckets[idx].revenue += p.paidAmount;
    else buckets[idx].cost += p.paidAmount;
  }
  const maxMonthly = Math.max(1, ...buckets.map((b) => Math.max(b.revenue, b.cost)));
  const bestMonth = buckets.reduce((best, b) => (b.revenue > best.revenue ? b : best), buckets[0]);

  // ---- Revenue by brand (BRAND paid, desc) ---------------------------------
  const brandMap = new Map<string, BrandAgg>();
  for (const p of brandPaid) {
    if (!p.brand || p.paidAmount <= 0) continue;
    const existing = brandMap.get(p.brand.id);
    if (existing) existing.revenue += p.paidAmount;
    else
      brandMap.set(p.brand.id, {
        id: p.brand.id,
        name: p.brand.companyName,
        color: p.brand.logoColor ?? "#64748b",
        revenue: p.paidAmount,
      });
  }
  const brandRows = Array.from(brandMap.values()).sort((a, b) => b.revenue - a.revenue);
  const maxBrand = Math.max(1, ...brandRows.map((b) => b.revenue));

  // ---- Top creators by payout (CREATOR paid, desc) -------------------------
  const creatorMap = new Map<string, CreatorAgg>();
  for (const p of creatorPaid) {
    if (!p.creator || p.paidAmount <= 0) continue;
    const existing = creatorMap.get(p.creator.id);
    if (existing) existing.payout += p.paidAmount;
    else
      creatorMap.set(p.creator.id, {
        id: p.creator.id,
        name: p.creator.name,
        color: p.creator.avatarColor ?? "#64748b",
        payout: p.paidAmount,
      });
  }
  const creatorRows = Array.from(creatorMap.values()).sort((a, b) => b.payout - a.payout);
  const maxPayout = Math.max(1, ...creatorRows.map((c) => c.payout));

  const hasData = totalRevenue > 0 || totalPayouts > 0;

  return (
    <div>
      <PageHeader
        title="Revenue Intelligence"
        subtitle="Profit, payouts, and margin — the financial heartbeat of the agency."
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Total Revenue"
          value={inr(totalRevenue, { compact: true })}
          sub="Collected from brands"
          icon={<TrendingUp className="h-5 w-5" />}
          tone="green"
        />
        <StatCard
          label="Total Payouts"
          value={inr(totalPayouts, { compact: true })}
          sub="Paid to creators"
          icon={<ArrowUpRight className="h-5 w-5" />}
          tone="amber"
        />
        <StatCard
          label="Gross Profit"
          value={inr(grossProfit, { compact: true })}
          sub="Revenue − payouts"
          icon={<Wallet className="h-5 w-5" />}
          tone={grossProfit >= 0 ? "blue" : "red"}
        />
        <StatCard
          label="Margin"
          value={percent(margin)}
          sub="Profit ÷ revenue"
          icon={<Percent className="h-5 w-5" />}
          tone={margin >= 0 ? "violet" : "red"}
        />
      </div>

      {!hasData ? (
        <EmptyState
          icon={<BarChart3 className="h-8 w-8" />}
          title="No revenue recorded yet"
          description="Once brand payments and creator payouts are marked paid, your profit, margin, and trend charts will populate here."
        />
      ) : (
        <div className="space-y-6">
          {/* Monthly trend */}
          <Card>
            <CardHeader
              title="Revenue Trend"
              subtitle="Brand revenue vs creator payouts — last 6 months"
              action={
                <span className="text-xs text-slate-500">
                  Best: <span className="font-semibold text-slate-700">{bestMonth.label} · {inr(bestMonth.revenue, { compact: true })}</span>
                </span>
              }
            />
            <div className="card-pad">
              <div className="flex items-end gap-3 sm:gap-5" style={{ height: "220px" }}>
                {buckets.map((b) => {
                  const revH = Math.round((b.revenue / maxMonthly) * 100);
                  const costH = Math.round((b.cost / maxMonthly) * 100);
                  return (
                    <div key={b.key} className="flex flex-1 flex-col items-center gap-2">
                      <div className="flex w-full flex-1 items-end justify-center gap-1.5">
                        <div className="group relative flex h-full flex-1 items-end justify-center">
                          <div
                            className="w-full max-w-[28px] rounded-t-md bg-emerald-500 transition-all"
                            style={{ height: `${Math.max(b.revenue > 0 ? 2 : 0, revH)}%` }}
                          />
                          <span className="pointer-events-none absolute -top-5 whitespace-nowrap text-[10px] font-semibold text-slate-500 opacity-0 transition-opacity group-hover:opacity-100">
                            {inr(b.revenue, { compact: true })}
                          </span>
                        </div>
                        <div className="group relative flex h-full flex-1 items-end justify-center">
                          <div
                            className="w-full max-w-[28px] rounded-t-md bg-amber-400 transition-all"
                            style={{ height: `${Math.max(b.cost > 0 ? 2 : 0, costH)}%` }}
                          />
                          <span className="pointer-events-none absolute -top-5 whitespace-nowrap text-[10px] font-semibold text-slate-500 opacity-0 transition-opacity group-hover:opacity-100">
                            {inr(b.cost, { compact: true })}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs font-medium text-slate-500">{b.label}</span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 flex items-center justify-center gap-6 border-t border-slate-100 pt-4 text-xs text-slate-500">
                <span className="inline-flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" /> Revenue
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-sm bg-amber-400" /> Payouts
                </span>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            {/* Revenue by brand */}
            <Card>
              <CardHeader
                title="Revenue by Brand"
                subtitle="Collected brand payments, highest first"
                action={<Building2 className="h-4 w-4 text-slate-400" />}
              />
              {brandRows.length === 0 ? (
                <p className="px-5 py-6 text-sm text-slate-500">No brand revenue collected yet.</p>
              ) : (
                <div className="card-pad space-y-3.5">
                  {brandRows.map((b) => {
                    const pct = Math.round((b.revenue / maxBrand) * 100);
                    const share = totalRevenue > 0 ? (b.revenue / totalRevenue) * 100 : 0;
                    return (
                      <div key={b.id}>
                        <div className="mb-1.5 flex items-center justify-between gap-3">
                          <Link
                            href={`/brands/${b.id}`}
                            className="flex min-w-0 items-center gap-2 text-sm font-medium text-slate-800 hover:text-brand-600"
                          >
                            <span
                              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[9px] font-bold text-white"
                              style={{ backgroundColor: b.color }}
                            >
                              {b.name.slice(0, 2).toUpperCase()}
                            </span>
                            <span className="truncate">{b.name}</span>
                          </Link>
                          <div className="shrink-0 text-right">
                            <span className="text-sm font-semibold text-slate-900">{inr(b.revenue, { compact: true })}</span>
                            <span className="ml-2 text-xs text-slate-400">{percent(share, 0)}</span>
                          </div>
                        </div>
                        <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                          <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${Math.max(2, pct)}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            {/* Top creators by payout */}
            <Card>
              <CardHeader
                title="Top Creators by Payout"
                subtitle="Total disbursed per creator"
                action={<Users className="h-4 w-4 text-slate-400" />}
              />
              {creatorRows.length === 0 ? (
                <p className="px-5 py-6 text-sm text-slate-500">No creator payouts recorded yet.</p>
              ) : (
                <div className="overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                        <th className="px-5 py-2.5">Creator</th>
                        <th className="px-5 py-2.5 text-right">Payout</th>
                        <th className="hidden px-5 py-2.5 sm:table-cell">Share</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {creatorRows.map((c) => {
                        const pct = Math.round((c.payout / maxPayout) * 100);
                        return (
                          <tr key={c.id} className="hover-row">
                            <td className="px-5 py-3">
                              <Link href={`/creators/${c.id}`} className="flex items-center gap-2.5 font-medium text-slate-800 hover:text-brand-600">
                                <Avatar name={c.name} color={c.color} size="sm" />
                                <span className="truncate">{c.name}</span>
                              </Link>
                            </td>
                            <td className="px-5 py-3 text-right font-semibold text-slate-900">{inr(c.payout, { compact: true })}</td>
                            <td className="hidden px-5 py-3 sm:table-cell">
                              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                                <div className="h-full rounded-full bg-amber-400" style={{ width: `${Math.max(2, pct)}%` }} />
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
